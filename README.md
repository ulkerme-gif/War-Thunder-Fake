# ÇELİK CEPHE — Birleşik Muharebe (Kara + Hava)

War Thunder tarzı tarayıcı oyunu (three.js r128). Hangar, araştırma ağacı, kadro yuvaları, SP ekonomisi ve 6'ya 6 kara + hava hakimiyet muharebesi.

## Hangar
- Seçili araç 3B hangarda döner tablada sergilenir (sürükle: döndür, tekerlek: yakınlaştır).
- Alttaki 5 kadro yuvasına araç yerleştir (⇄ ile değiştir). Muharebede bu kadroyla doğarsın.
- Üstte SL (gümüş) ve RP (araştırma puanı), seviye çubuğu, Arcade/Gerçekçi seçimi ve SAVAŞA! düğmesi.
- İlerleme tarayıcıda saklanır (localStorage).

## Araştırma ağacı (ABD)
| Rank | Ana muharebe tankı | Piyade savaş aracı | Taarruz uçağı |
|---|---|---|---|
| V | — | M2A2 Bradley (8.3) | — |
| VI | M1 Abrams (10.0) | M2A2 ODS (9.3) | A-10A erken (10.0) |
| VII | M1A1 Abrams (11.0) | M3A3 Bradley (9.7) | A-10A geç (10.7) |
| VIII | M1A2 Abrams (11.7) | M2A3 Bradley (10.0) | A-10C (11.3, AGM-65 Maverick) |

Araştırma RP, satın alma SL ister; ikisi de muharebe sonunda puanına göre kazanılır. Rakipler kadronun en yüksek BR'sine göre eşleşir.

## Muharebe
- 1,6 km'lik muharebe alanı, ufukta dağlar, nehir (sığ geçitler, suda tanklar yavaşlar), köyler ve kasaba.
- SP: ilk kara aracı ücretsiz; imha, isabet ve nokta ele geçirme SP kazandırır. Uçak SP ister. Düşman da Su-25 çağırır.
- Açıya bağlı zırh delme, sekme, mürettebat/modül hasarı, vuruş kamerası, lazer menzil ölçerli nişangâh.

## Kontroller
**Tank:** W/S gaz-geri · A/D dönüş · Fare nişan · Sol tık/Space ateş · Sağ tık/Shift nişangâh · 1-2-3 mühimmat · R hızlı doldur · X onarım · F söndür
**Uçak:** Fare uçuş yönü · W/S gaz · A/D yatış · Sol tık top · R/E roket · Space bomba · Q Maverick (A-10C) · Sağ tık zoom
**Genel:** J araçtan ayrıl · C serbest bakış · Tab skor · Esc duraklat

## Çalıştırma
Dosyaya çift tıklayarak (file://) açılmaz. GitHub Pages'te doğrudan çalışır; yerelde `python3 -m http.server 8000` → `http://localhost:8000`.
