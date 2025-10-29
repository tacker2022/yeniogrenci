# Öğrenci Takip Panosu

Modern web teknolojileri ile hazırlanmış bu uygulama, öğrenci takibini kolaylaştırmak için tasarlanmış tek sayfalık bir panodur. Öğrenci bilgilerini saklar, durumlarına göre filtreleme yapar, notları görüntülemeye izin verir ve listeyi CSV formatında dışa aktarır.

## Özellikler
- 🎯 Öğrencileri isim, iletişim, program, durum, ilerleme ve notlarıyla beraber kaydedebilme
- 🔍 Durum filtresi ve anlık arama ile hızlı listeleme
- 📊 Durum kartları ile toplam aktif, tatilde, mezun ve risk altındaki öğrenci sayısını görüntüleme
- 🗒️ Notları diyalog penceresinde görüntüleme
- 💾 Tarayıcı `localStorage` alanına otomatik kaydetme ve örnek veri ile başlatma
- 🌗 Karanlık / aydınlık tema desteği
- 📤 Listeyi CSV dosyası olarak dışa aktarma

## Kurulum
Herhangi bir derleme adımı gerektirmez. Depoyu indirip doğrudan tarayıcınızda `index.html` dosyasını açmanız yeterlidir.

### Adım Adım Açılış
1. Depoyu indirin veya ZIP olarak bilgisayarınıza kaydedip klasöre çıkarın.
2. Klasördeki `index.html` dosyasına çift tıklayın.
   - Windows/macOS'ta varsayılan tarayıcı otomatik olarak açılır.
   - Eğer tarayıcı seçmeniz istenirse Chrome, Edge, Firefox veya Safari'den birini seçebilirsiniz.
3. Uygulama tarayıcıda açıldığında tüm işlevleri çevrimdışı çalışır; ek bir sunucuya gerek yoktur.

Komut satırı kullanmak isterseniz:

```bash
git clone https://github.com/<kullanici>/yeniogrenci.git
cd yeniogrenci
# macOS'ta
open index.html
# Windows'ta (PowerShell)
start index.html
# Linux'ta (varsayılan tarayıcıyı açar)
xdg-open index.html
```

> Not: Uygulama verileri tarayıcı üzerinde sakladığı için farklı tarayıcı veya cihazlarda farklı veri setleri oluşacaktır.

## Geliştirme
Dosyalar düz HTML/CSS/JS kullanılarak hazırlanmıştır. Bir canlı geliştirme sunucusu kurmak isterseniz örneğin `npm` ile `serve` paketini veya VS Code "Live Server" eklentisini kullanabilirsiniz.

### Kod Yapısı
- `index.html`: Arayüz bileşenleri ve temel sayfa yapısı
- `styles.css`: Görsel tasarım, tipografi ve responsive düzenler
- `app.js`: Öğrenci listesi mantığı, filtreleme, tema, CSV aktarımı

Görüş ve katkılarınızı bekleriz!
