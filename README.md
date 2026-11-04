# ÇELİK CEPHE — Birleşik Muharebe (Kara + Hava)

War Thunder tarzı tarayıcı oyunu (three.js r128). 6'ya 6 hakimiyet muharebesi: A/B/C noktalarını tut, düşman biletlerini erit; SP biriktirip taarruz uçağıyla gökyüzüne çık.

## Kadro ve SP
| Araç | Rol | Maliyet |
|---|---|---|
| M1A2 Abrams | Ana muharebe tankı (120 mm, APFSDS / HEAT-FS) | İlk kara aracı ücretsiz, sonra 240 SP |
| M2A3 Bradley | 25 mm M242 + TOW-2, uçaksavar görevi | İlk kara aracı ücretsiz, sonra 150 SP |
| A-10A | Taarruz uçağı: GAU-8, 14 roket, 6 bomba | 420 SP |

SP kazanımı: imha +160 · uçak düşürme +200 · nokta +120 · asist +60 · delici isabet +15. Her araç muharebede bir kez kullanılır. Düşman takımı da SP biriktirip Su-25 taarruz uçağı çağırır.

## Modlar
- **Arcade:** düşman işaretleri, uçaklar için öndeleme göstergesi, hızlı doldurma/onarım.
- **Gerçekçi:** düşman işareti yok; yalnızca takımının gördüğü düşmanlar mini haritada belirir.

## Kontroller
**Tank:** W/S gaz-geri · A/D dönüş · Fare nişan · Sol tık/Space ateş · Sağ tık/Shift nişangâh · Tekerlek zoom · 1-2-3 mühimmat · R hızlı doldur · X onarım · F yangın söndür
**Uçak:** Fare uçuş yönü · W/S gaz · A/D yatış · Sol tık top · R/E roket · Space bomba · Sağ tık zoom
**Genel:** J araçtan ayrıl · C serbest bakış · Tab skor tablosu · Esc duraklat
Tablet: sol başparmak sürüş (uçakta gaz + yatış), sağ yarı nişan, ekran düğmeleri.

## Çalıştırma
Modeller `fetch` ile yüklendiği için dosyaya çift tıklayarak (file://) açılmaz. GitHub Pages'te doğrudan çalışır; yerelde `python3 -m http.server 8000` çalıştırıp `http://localhost:8000` adresini aç.

## Dosyalar
- `index.html` — arayüz ve ekranlar
- `js/game.js` — oyunun tamamı
- `assets/models/*.glb` — Abrams ve Bradley modelleri
- `assets/tex/*.jpg` — 2K ve 1K (`_lq`, düşük grafik) dokular
