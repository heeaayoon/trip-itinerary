//supabase와 연결 설정 및 인증
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jyerijwjeiqvuyxqzsyi.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)