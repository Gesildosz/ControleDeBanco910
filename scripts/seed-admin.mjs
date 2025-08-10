import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs" // CORRIGIDO: Alterado de "bcrypt" para "bcryptjs"

// Carrega variáveis de ambiente do .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Erro: As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  },
});

async function seedAdmin() {
  const username = "GDSSOUZ5";
  const password = "902512"; // Senha padrão
  const fullName = "Administrador Padrão";
  const badgeNumber = "00000"; // Crachá opcional para admin

  try {
    // Verifica se o administrador já existe
    const { data: existingAdmin, error: fetchError } = await supabase
      .from("administrators")
      .select("id")
      .eq("username", username)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error("Erro ao verificar administrador existente:", fetchError.message);
      return;
    }

    if (existingAdmin) {
      console.log(`Administrador com usuário '${username}' já existe. Pulando a criação.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from("administrators").insert([
      {
        full_name: fullName,
        badge_number: badgeNumber,
        username: username,
        password_hash: passwordHash,
        can_create_collaborator: true,
        can_create_admin: true,
        can_enter_hours: true,
        can_change_access_code: true,
      },
    ]);

    if (error) {
      console.error("Erro ao semear administrador:", error.message);
    } else {
      console.log(`Administrador '${username}' semeado com sucesso!`);
    }
  } catch (error) {
    console.error("Erro inesperado ao semear administrador:", error);
  }
}

seedAdmin();
