export interface User {
  id:          number;
  name:        string;
  email:       string;
  level:       'pendente'|'iniciante'|'junior'|'pleno'|'senior';
  avatar_url?: string;
  badge?:      string;
  badge_label?:string;
  identifier?: string;
  verified?:   boolean;
  role:        'user'|'admin';
  theme?:      'light'|'dark';
  language?:   'pt'|'en';
}

export interface Post {
  id:                 number;
  user_id:            number;
  title:              string;
  content:            string;
  image_url?:         string;
  file_url?:          string;
  file_name?:         string;
  is_open_source:     boolean;
  created_at:         string;
  author_name:        string;
  author_level:       string;
  author_avatar?:     string;
  author_badge?:      string;
  author_badge_label?:string;
  likes_count:        number;
  comments_count:     number;
}

export interface Comment {
  id:           number;
  post_id:      number;
  user_id:      number;
  content:      string;
  created_at:   string;
  author_name:  string;
  author_avatar?:string;
  author_level: string;
}

export interface Job {
  id:              number;
  company_name:    string;
  title:           string;
  description:     string;
  level_required:  string;
  location:        string;
  type:            string;
  contact_email:   string;
  skills:          string[];
  application_count: number;
  created_at:      string;
  applied?:        boolean;
}

export interface Conversation {
  conversation_id: number;
  other_name:      string;
  other_avatar?:   string;
  other_level:     string;
  last_message?:   string;
  last_at?:        string;
  unread:          number;
}

export interface Message {
  id:           number;
  sender_id:    number;
  sender_name:  string;
  sender_avatar?:string;
  content:      string;
  created_at:   string;
  read:         boolean;
}

export interface AuthState {
  user:  User | null;
  token: string | null;
}
