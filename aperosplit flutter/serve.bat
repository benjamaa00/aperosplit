@echo off
echo ========================================
echo   AperoSplit - Serveur local
echo ========================================
echo.
echo Lancement du serveur sur http://localhost:8080
echo.
echo OUVRIR DANS LE NAVIGATEUR:
echo   http://localhost:8080
echo.
echo INSTALATION SUR TELEPHONE:
echo   1. Connectez le PC et le telephone au meme WiFi
echo   2. Ouvrez Chrome/Safari sur le telephone
echo   3. Allez a l'adresse IP du PC: http://IP_DU_PC:8080
echo   4. Android: Menu "Ajouter a l'ecran d'accueil"
echo   5. iPhone: Menu Partager "Ajouter a l'ecran d'accueil"
echo.
cd /d "%~dp0app\build\web"
python -m http.server 8080
pause
