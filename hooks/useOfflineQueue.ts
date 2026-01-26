import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

const QUEUE_KEY = 'offline_upload_queue';

export interface UploadTask {
  id: string; // Unique ID for the task
  expenseData: any;
  imageUri: string;
  createdAt: number;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<UploadTask[]>([]);

  // Load initial queue
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const json = await AsyncStorage.getItem(QUEUE_KEY);
      if (json) setQueue(JSON.parse(json));
    } catch (error) {
      console.error('Error reading queue:', error);
    }
  };

  // 1. Add task to queue
  const addToQueue = async (task: UploadTask) => {
    try {
      const currentQueue = await getQueue(); // Read from storage to be safe
      const newQueue = [...currentQueue, task];
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
      setQueue(newQueue); // Update state
      console.log('Task added to offline queue:', task.id);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  // Helper to read storage directly
  const getQueue = async (): Promise<UploadTask[]> => {
    try {
      const json = await AsyncStorage.getItem(QUEUE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      return [];
    }
  };

  // 3. Process Queue
  const processQueue = useCallback(async () => {
    const currentQueue = await getQueue();
    if (currentQueue.length === 0) return;

    console.log(`Processing ${currentQueue.length} offline tasks...`);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const remainingTasks: UploadTask[] = [];

    for (const task of currentQueue) {
      try {
        console.log(`Uploading offline receipt for task: ${task.id}`);
        
        // 1. Upload Image
        const response = await fetch(task.imageUri);
        const blob = await response.arrayBuffer();
        const fileName = `${user.id}/${task.createdAt}.jpg`; 

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from("receipts").getPublicUrl(fileName);
        
        // 2. Insert Expense
        const { error: insertError } = await supabase.from("expenses").insert({
          ...task.expenseData,
          user_id: user.id,
          receipt_url: publicUrl.publicUrl,
          status: "pending"
        });

        if (insertError) throw insertError;
        
        console.log(`Task ${task.id} synced successfully.`);

      } catch (error) {
        console.error(`Failed to process task ${task.id}:`, error);
        remainingTasks.push(task);
      }
    }

    // Save remaining tasks
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingTasks));
    setQueue(remainingTasks);
  }, []);

  // 4. Auto-process on network restore
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        processQueue();
      }
    });

    return () => unsubscribe();
  }, [processQueue]);

  return { queue, addToQueue };
}
