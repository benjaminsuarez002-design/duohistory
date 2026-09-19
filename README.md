# DuoHistory LoL

Compara el historial de dos Riot IDs y muestra las partidas que jugaron juntos.

## App pública
- Backend/API: https://tizyjenayrcdkcodsjnc.supabase.co/functions/v1/duohistory
- Frontend: pensado para GitHub Pages desde este repositorio.

## Cómo funciona
1. Convierte ambos Riot IDs a PUUID.
2. Descarga los IDs de partidas de ambos jugadores.
3. Cruza ambos historiales localmente.
4. Solo descarga el detalle de las partidas coincidentes.
5. Calcula partidas juntas, victorias, derrotas, winrate y promedios K/D/A.

## Privacidad
La Riot API key se guarda en `localStorage` del navegador del usuario.
La caché de historial y partidas se guarda en `IndexedDB`.
La Edge Function de Supabase recibe la key únicamente durante cada consulta y no la persiste.

## Supabase
El código desplegado está en:
`supabase/functions/duohistory/index.ts`

Proyecto Supabase actual: `tizyjenayrcdkcodsjnc`.
