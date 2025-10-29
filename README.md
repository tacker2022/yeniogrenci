# Öğrenci Takip Panosu

Modern web teknolojileri ile hazırlanmış bu uygulama, öğrenci takibini kolaylaştırmak için tasarlanmış tek sayfalık bir panodur. Öğrenci bilgilerini saklar, durumlarına göre filtreleme yapar, notları görüntülemeye izin verir ve listeyi CSV formatında dışa aktarır.

## Özellikler
- 🎯 Öğrencileri isim, iletişim, program, mentor, ilerleme ve notlarıyla beraber kaydedebilme
- 🔍 Durum filtresi, anlık arama ve minimum ilerleme slider’ı ile hızlı listeleme
- 🚨 Tek tıkla “dikkat gerektirenler” filtresiyle riskli öğrencileri ayıklama
- 📊 Durum kartları ve akıllı içgörüler ile ortalama ilerleme, yaklaşan takipler ve spotlight öğrenci takibi
- 🗓️ Mentor, son görüşme ve takip tarihi alanlarıyla premium CRM deneyimi
- 🧠 Zaman çizelgesi ve akıllı önerilerle haftalık aksiyon planı oluşturma
- 📋 “Anlık Durum” butonu ile özet raporu panodan kopyalama veya indirme
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
- `styles.css`: Görsel tasarım, premium kartlar, zaman çizelgesi ve responsive düzenler
- `app.js`: Öğrenci listesi mantığı, gelişmiş filtreler, içgörüler, tema ve CSV aktarımı

Görüş ve katkılarınızı bekleriz!
