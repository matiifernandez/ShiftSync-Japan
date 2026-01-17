export const translations = {
  en: {
    // Tabs
    tab_home: "Home",
    tab_chat: "Chat",
    tab_travel: "Travel",
    tab_schedule: "Schedule",
    
    // Home
    greeting_morning: "Ohayou gozaimasu",
    greeting_afternoon: "Konnichiwa",
    greeting_evening: "Konbanwa",
    next_activity: "NEXT ACTIVITY",
    quick_actions: "Quick Actions",
    expenses: "Expenses",

    // Chat
    messages_title: "Messages",
    search_placeholder: "Search conversations...",
    no_conversations: "No conversations found",
    type_message: "Type a message...",
    translated_label: "TRANSLATED",
    new_chat: "New Chat",
    create_group: "Create Group",
    group_name: "Group Name",
    select_members: "Select Members",
    delete_chat_title: "Delete Chat",
    delete_chat_msg: "Are you sure you want to delete this conversation?",
    delete_confirm: "Delete",

    // Travel
    travel_logistics: "Travel Logistics",
    open_maps: "Open in Google Maps",
    remind_me: "Remind me to leave on time",
    
    // Schedule
    schedule_title: "Schedule",
    no_events: "No events scheduled",
    work_shift: "Work Shift",
    travel_day: "Travel / Transit",
    off_day: "Day Off",

    // Expenses
    expenses_title: "Expenses",
    new_expense: "New Expense",
    edit_expense: "Edit Expense",
    expense_details: "Expense Details",
    total_amount: "Total Amount",
    category: "Category",
    description: "Description",
    receipt: "Receipt",
    submit: "Submit Expense",
    save_changes: "Save Changes",
    delete_expense: "Delete Expense",
    approve: "Approve",
    reject: "Reject",
    // Categories
    cat_transport: "Transport",
    cat_hotel: "Hotel",
    cat_fuel: "Fuel",
    cat_parking: "Parking",
    cat_meals: "Meals",
    cat_other: "Other",

    // Profile
    setup_profile: "Setup Profile",
    edit_profile: "Edit Profile",
    full_name: "Full Name",
    org_id: "Organization ID",
    pref_language: "Preferred Language",
    complete_setup: "Complete Setup",
    log_out: "Log Out",
    upload_photo: "Upload Photo",
    photo_required: "Face clearly visible required",
    
    // Schedule Admin
    start_date: "Start Date",
    end_date: "End Date",
    start_time: "Start Time",
    end_time: "End Time",
    location: "Location",
    select_staff: "Select Staff",
    create_shifts: "Create Shifts",
    select_all: "Select All",
    discard_title: "Discard Changes?",
    discard_msg: "Going back will discard your unsaved shift.",
    discard_confirm: "Discard",
    keep_editing: "Keep Editing",
  },
  ja: {
    // Tabs
    tab_home: "ホーム",
    tab_chat: "チャット",
    tab_travel: "移動",
    tab_schedule: "日程",

    // Home
    greeting_morning: "おはようございます",
    greeting_afternoon: "こんにちは",
    greeting_evening: "こんばんは",
    next_activity: "次の予定",
    quick_actions: "クイックアクション",
    expenses: "経費精算",

    // Chat
    messages_title: "メッセージ",
    search_placeholder: "会話を検索...",
    no_conversations: "会話が見つかりません",
    type_message: "メッセージを入力...",
    translated_label: "翻訳済み",
    new_chat: "新規チャット",
    create_group: "グループ作成",
    group_name: "グループ名",
    select_members: "メンバー選択",
    delete_chat_title: "チャットを削除",
    delete_chat_msg: "この会話を削除してもよろしいですか？",
    delete_confirm: "削除",

    // Travel
    travel_logistics: "移動ロジスティクス",
    open_maps: "Googleマップで開く",
    remind_me: "出発時間にリマインド",

    // Schedule
    schedule_title: "スケジュール",
    no_events: "予定はありません",
    work_shift: "勤務",
    travel_day: "移動日",
    off_day: "休日",

    // Expenses
    expenses_title: "経費",
    new_expense: "経費登録",
    edit_expense: "経費編集",
    expense_details: "経費詳細",
    total_amount: "合計金額",
    category: "カテゴリー",
    description: "備考",
    receipt: "レシート",
    submit: "申請する",
    save_changes: "変更を保存",
    delete_expense: "削除する",
    approve: "承認",
    reject: "却下",
    // Categories
    cat_transport: "交通費",
    cat_hotel: "宿泊費",
    cat_fuel: "ガソリン代",
    cat_parking: "駐車場代",
    cat_meals: "食事代",
    cat_other: "その他",

    // Profile
    setup_profile: "プロフィール設定",
    edit_profile: "プロフィール編集",
    full_name: "氏名",
    org_id: "組織ID",
    pref_language: "言語設定",
    complete_setup: "設定を完了",
    log_out: "ログアウト",
    upload_photo: "写真をアップロード",
    photo_required: "顔がはっきり見える写真",

    // Schedule Admin
    start_date: "開始日",
    end_date: "終了日",
    start_time: "開始時間",
    end_time: "終了時間",
    location: "場所",
    select_staff: "スタッフを選択",
    create_shifts: "シフトを作成",
    select_all: "全員選択",
    discard_title: "変更を破棄しますか？",
    discard_msg: "保存されていないシフトは破棄されます。",
    discard_confirm: "破棄する",
    keep_editing: "編集を続ける",
  }
};

export type TranslationKey = keyof typeof translations.en;
