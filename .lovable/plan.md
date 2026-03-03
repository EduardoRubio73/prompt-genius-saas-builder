

## Correção: "permission denied for table users"

**Causa raiz**: A política RLS `"Super admins can view all organizations"` na tabela `organizations` faz referência direta à tabela `auth.users` (verificando `users.is_super_admin = true`). O role `authenticated` não tem permissão de SELECT na tabela `auth.users`, causando o erro.

Já existe a política `admin_orgs_select` que usa `is_super_admin()` corretamente, e `admin_orgs_update` que também usa a função. A política problemática é redundante e deve ser removida.

**Correção**: Uma migration para dropar a política `"Super admins can view all organizations"` da tabela `organizations`.

### Arquivo

| Arquivo | Alteração |
|---------|-----------|
| Nova migration SQL | `DROP POLICY "Super admins can view all organizations" ON public.organizations;` |

Isso resolve o erro porque as outras políticas (`admin_orgs_select`, `org_select_member`, `Users can view their own organization`) já cobrem todos os cenários de acesso.

