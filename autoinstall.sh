rm android/app/build/outputs/apk/release/app-release-*
bun run build 
bunx cap sync
bunx cap build android

zipalign -v -p 4 android/app/build/outputs/apk/release/app-release-signed.apk android/app/build/outputs/apk/release/app-release-aligned.apk

apksigner sign -ks android/ipick.jks --out android/app/build/outputs/apk/release/app-release-signed.apk android/app/build/outputs/apk/release/app-release-aligned.apk 	

adb install -r android/app/build/outputs/apk/release/app-release-signed.apk

# Create a directory to store the apks
rm apks/app-release-signed.apk
cp android/app/build/outputs/apk/release/app-release-signed.apk apks/app-release-signed.apk

# Rename the file
mv apks/app-release-signed.apk apks/iPick.apk
