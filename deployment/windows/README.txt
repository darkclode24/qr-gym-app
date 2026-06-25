QR GYM - RECEPTIONIST INSTALLER

Requirements:
1. Windows 10 or 11.
2. Docker Desktop installed and configured to start with Windows.
3. Internet access for installation and updates.

First installation:
1. Double-click "Install QR Gym.bat".
2. Wait until the browser opens.
3. Optionally double-click "Enable Automatic Updates.bat" once.

Daily use:
- Double-click "Start QR Gym.bat" if the browser is not already open.
- Open http://localhost:3000

Safety:
- Every update stops the app briefly and creates a consistent backup first.
- Backups are stored in Documents\QR-Gym-Backups.
- Database and uploads use external Docker volumes.
- These scripts never run "docker compose down -v", "docker volume rm", or pruning commands.

Important:
- Do not uninstall Docker Desktop or manually delete Docker volumes.
- Keep the QR-Gym-Backups folder in your normal computer backup.
- If an update fails, send the error message and latest backup folder to the developer.
