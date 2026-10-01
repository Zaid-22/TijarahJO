-- =============================================================================
-- TijarahJo Sample Post Seed Data
-- Generated from the local sample post source folders.
--
-- This file is self-contained for database rows: it creates one disabled fake
-- user account per sample post, upserts the post, and upserts its PostImages
-- rows with /uploads/post-images/sample-* URLs.
--
-- The physical image files must exist in the API uploads/post-images folder
-- when the app serves these URLs.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

IF OBJECT_ID(N'tempdb..#SamplePosts', N'U') IS NOT NULL DROP TABLE #SamplePosts;
IF OBJECT_ID(N'tempdb..#SampleImages', N'U') IS NOT NULL DROP TABLE #SampleImages;

CREATE TABLE #SamplePosts
(
    SourceKey NVARCHAR(200) NOT NULL PRIMARY KEY,
    UserEmail NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20) NOT NULL DEFAULT N'',
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NULL,
    CategoryName NVARCHAR(100) NOT NULL,
    PostTitle NVARCHAR(200) NOT NULL,
    Price DECIMAL(18,2) NULL,
    PostDescription NVARCHAR(4000) NULL,
    CityName NVARCHAR(100) NOT NULL DEFAULT N'Amman',
    AreaName NVARCHAR(100) NOT NULL DEFAULT N'Jubaiha'
);

CREATE TABLE #SampleImages
(
    SourceKey NVARCHAR(200) NOT NULL,
    PostImageURL NVARCHAR(2048) NOT NULL,
    SortOrder INT NOT NULL
);

INSERT INTO #SamplePosts
    (SourceKey, UserEmail, FirstName, LastName, CategoryName, PostTitle, Price, PostDescription)
VALUES
(N'books-and-stationery-1', N'sample-post-books-and-stationery-1@tijarahjo.local', N'يوسف', N'الخالدي', N'Books & Stationery', N'كتاب توفيل و كتب تاسيس', 2.00, N'كتاب توفيل ب 2.5
كتب تاسيس انجليزي ب 2 الكتاب
يوجد خدمه توصيل'),
(N'books-and-stationery-2', N'sample-post-books-and-stationery-2@tijarahjo.local', N'نور', N'الحسن', N'Books & Stationery', N'كتب طبية للبيع كل كتاب اله سعر التواصل على الواتساب', 50.00, N'كتب طبية للبيع مستعمل بحالة الوكالة كل كتاب اله سعر التواصل على الواتساب السعر قابل للتفاوض'),
(N'books-and-stationery-3', N'sample-post-books-and-stationery-3@tijarahjo.local', N'ريم', N'العمري', N'Books & Stationery', N'Diary of a wimpy kid roald dahl BOOKS', 20.00, N'some books are not used and some books are , بعض الكتب مستعملة
6 (Diary of a wimpy kid books) /6كتب
3 (roald dahl books ) 3 كتب'),
(N'books-and-stationery-4', N'sample-post-books-and-stationery-4@tijarahjo.local', N'عمر', N'الزيدي', N'Books & Stationery', N'كتاب Cambridge IGCSE Chemistry – النسخة الرابعة – حالة ممتازه', 9.00, N'كتاب Cambridge IGCSE Chemistry Coursebook – الطبعة الرابعة بحالة ممتازة دون أي تمزقات أو ملاحظات، مناسب للدراسة والمراجعة ويُعد من أفضل المراجع لمنهج الكيمياء. السعر 10 دنانير قابل للتفاوض، ويتوفر توصيل داخل عمّان. موقعي في الجبيهة – عمّان، ويمكن ترتيب توصيل سريع وسهل عند الطلب'),
(N'books-and-stationery-5', N'sample-post-books-and-stationery-5@tijarahjo.local', N'سارة', N'النعيمي', N'Books & Stationery', N'لطلاب الادب الانجليزي: ثلاث كتب دراسية للبيع بنصف السعر الاصلي', 10.00, N'The Norton Anthology: American Literature, 7th Edition, Volume A

The Norton Anthology: American Literature, 7th Edition, Volume B

Oxford Practical English Usage, Michael Swan, 3rd Edition

الكتاب الواحد ب10 دنانير، الثلاث كتب معا ب 25 دينار

المكان: عمان القويسمة.

خدمة التوصيل الى مجمع رغدان متوفرة بسعر رمزي'),
(N'books-and-stationery-6', N'sample-post-books-and-stationery-6@tijarahjo.local', N'خالد', N'الرشيدي', N'Books & Stationery', N'علم نفسك اللغة الانجليزية من خلال كتب و سيديات', 100.00, N'برنامج بريطاني كامل لتعلم اللغة الإنجليزية بشكل ذاتي
ثلاث مستويات : مبتدئ متوسط متقدم
لكل مستوى كتب و سيديات خاصة به
تعلم من خلال الحوارات و مصطلحات الحياة اليومية

سعر البرنامج الأصلي فوق ال600 دينار
سعر البيع 100 دينار فقط'),
(N'books-and-stationery-7', N'sample-post-books-and-stationery-7@tijarahjo.local', N'لينا', N'المصري', N'Books & Stationery', N'كتب تخصص صيدلة مستعملة كيمياء عضوية، أساسيات الكيمياء العضوية، فسيولوجية الانسان، علم الاجتماع', 8.00, N'كتب تخصص صيدلة مستعملة
كيمياء عضوية،
أساسيات الكيمياء العضوية،
فسيولوجية الانسان،
مقدمة في علم الاجتماع.

العنوان:
عمان / مرج الحمام - دوار الجندي / إسكان سلطة المصادر الطبيعة

السعر: 8 دنانير الأربع كتب مع بعض'),
(N'books-and-stationery-8', N'sample-post-books-and-stationery-8@tijarahjo.local', N'أحمد', N'الشمري', N'Books & Stationery', N'للبيع كتب مستعملة بحالة ممتازة، منهاج مدرسي امريكي', 30.00, N'السلام عليكم ورحمة الله وبركاته
للبيع كتب مستعملة بحالة ممتازة وسعر ممتاز، منهاج مدرسي امريكي
ACT American international schools, GR1 ~GR12
متوفر بعمان'),
(N'computers-and-laptops-1', N'sample-post-computers-and-laptops-1@tijarahjo.local', N'فيصل', N'الدوسري', N'Computers & Laptops', N'شنته كتف لابتوب اوكادي T-68-حجم 13.3" Okade T68 13.3" Business Laptop bag', 18.00, N'شنته كتف لابتوب اوكادي T68-حجم 13.3" Okade T68 13.3" Business Laptop bag
حقيبة كمبيوتر محمول ملونة مقاومة للصدمات ومقاومة للماء خفيفة ورقيقة للسفر للعمل والمدارس حقيبة كتف للرجال والنساء

اهلا وسهلا فيكم بشركة هاي تك

بتقدروا تزورونا بمعرضنا بالجاردنز ش وصفي التل. مجمع 73 معرض هاي تك HIGH TECH
أوقات الدوام يوميا من 9ص-10م ويوم الجمعه من 4م-10م
خدمة التوصيل متوفرة لجميع مناطق المملكة ب 3 دنانير خلال 24-48 ساعه'),
(N'computers-and-laptops-2', N'sample-post-computers-and-laptops-2@tijarahjo.local', N'منى', N'العتيبي', N'Computers & Laptops', N'Lenovo Thinkpads and Thinkbooks for sale', 225.00, CONCAT(
    N'Various Lenovo Thinkpad laptops and Thinkbook laptops for sale.', CHAR(13), CHAR(10), CHAR(13), CHAR(10),
    N'See photos for specifications of the laptops.', CHAR(13), CHAR(10), CHAR(13), CHAR(10),
    N'1. Lenovo Thinkbook 13s.', CHAR(13), CHAR(10),
    N'# Intel Core i5 11th', CHAR(13), CHAR(10),
    N'# 8 GB Ram', CHAR(13), CHAR(10),
    N'# 256GB SSD NVMe storage', CHAR(13), CHAR(10),
    N'# 1Gb Intel Iris Xe GPU', CHAR(13), CHAR(10),
    N'# very good condition', CHAR(13), CHAR(10),
    N'# 146 battery cycles', CHAR(13), CHAR(10), CHAR(13), CHAR(10),
    N'Price: 225 jod', CHAR(13), CHAR(10), CHAR(13), CHAR(10),
    N'2. Lenovo Thinkpad L15', CHAR(13), CHAR(10),
    N'# Amd Ryzen 7 Pro', CHAR(13), CHAR(10),
    N'# 32 GB Ram', CHAR(13), CHAR(10),
    N'# 256GB SSD Storage', CHAR(13), CHAR(10),
    N'# 1GB Amd GPU', CHAR(13), CHAR(10),
    N'# 426 battery cycles')),
(N'computers-and-laptops-3', N'sample-post-computers-and-laptops-3@tijarahjo.local', N'زياد', N'الحربي', N'Computers & Laptops', N'Lenovo laptop with accessories (cooling fan wireless lenovo mouse and red dragon headset)', 650.00, N'Brand/Model: Lenovo LOQ 15IAX9E used for 5 months feels like new
• Processor (CPU): Intel Core i7-12650HX (12th Generation)
• Graphics Card (GPU): NVIDIA GeForce RTX 4050 (6GB)
• Memory (RAM): 16GB DDR5
• Storage: 512GB NVMe SSD
• Display: 15.6-inch FHD (Full HD), 144Hz Refresh Rate
• Operating System: Original Windows included'),
(N'computers-and-laptops-4', N'sample-post-computers-and-laptops-4@tijarahjo.local', N'هند', N'الغامدي', N'Computers & Laptops', N'Yasoomade YS-C003 Shoulder and Handbag Laptop Bag', 29.00, N'اكسسوارت الكمبيوتر بأسعار مميزة !
Yasoomade YS-C003 Shoulder and Handbag Laptop Bag-حقيبة لابتوب

Interior Slot Pocket,Cell Phone Pocket,Interior Zipper Pocket
Polyester- Canvas
Size: 17"
Compartment,Computer Interlayer
You Can Use it As Backpack Or Shoulder
موقعنا الجاردنز ش وصفي التل. مجمع 73 شركة هاي تك بجانب ابو شقرا للعطور
https://maps.app.goo.gl/YsBmRHnVppfmD6TB8
خدمة التوصيل لجميع مناطق المملكة
Visit us to our Showroom located At Al Gardenz Wasfi Altal St. Bldg #73'),
(N'computers-and-laptops-5', N'sample-post-computers-and-laptops-5@tijarahjo.local', N'طارق', N'السبيعي', N'Computers & Laptops', N'Laptop HP Pavilion x360 Laptop - 14-EK0033DX-Cor لابتوب أتش بي اي فايف جيل 12 بلف 360درجة شاشة تتش', 549.00, N'Sub Brand
Sub Brand Lightweight
Processor Specifications
Processor Generation 12th Generation
Processor Family Intel Core i5-1235U
Processor Speed 3.30 Ghz up to 4.4 GHz
Processor Cache 12MB
Number of Cores 10 Cores - 12 Threads
Memory
RAM Capacity 8GB
Memory Type DDR4
Storage
Storage Capacity 512GB SSD PCIe NVMeTM M.2 SSD
Storage Type SSD
Graphic Card
Graphic Manufacturer Intel
Graphic Model Intel Iris Plus Graphics
Graphic Memory Source Integrated
Display Specifications
Display Size 14.0" Touch Screen
Display Technology diagonal HD SVA micro-edge WLED-backlit multitouch
Display Resolution 1366 x 768
Touch Screen YES
Inputs & Outputs
Keyboard Full-size island-style natural silver keyboard
Ports 1x SuperSpeed USB Type-C 10Gbps signaling rate (USB Power DeliveryDisplayPortTM 1.4HPSleep and Charge)(42)(50)(64)2x SuperSpeed USB Type-A 5Gbps signaling rate1x Headphone/microphone combo1x AC smart pin1x HDMI 2.1
Optical Drive NA
Camera HP TrueVision HD Camera with integrated digital microphone
Audio Audio by Bang & Olufsen; Dual speakers; HP Audio Boost
Connectivity
Networking Realtek Wi-Fi 5 (2x2) and Bluetooth 5 Combo (MU-MIMO supported)Intel Wi-Fi 6 AX 201 (2x2) and Bluetooth 5 combo (Supporting Gigabit file transfer speeds)
Battery Specifications
Battery Number of Cells 3
Operation System
Operation System Windows 11 Home 64
General Information
Warranty
أكبر تشكيلة من كافة الماركات الأشهر عالميا على أجهزة الحاسوب و اللابتوب المستعمل والجديد بأقل الأسعار.

خيارات متعددة وأسعار متنوعة تلبي احتياجات الجمبيع.
مواصفات عالية وتشكيلة تلبي جميع الاختيارات.

خدمة التوصيل متوفرة لجميع المحافظات في المملكة.
خدمة ما بعد البيع دعم فني متواصل اونلاين على مدار ساعات العمل



------------------------------------------------------------
موقعنا عمان شارع الجاردنز بجانب مسجد الطباع مجمع رقم 90 بنفس مجمع كارفور الطابق الأول على الدرج الكهربائي .'),
(N'computers-and-laptops-6', N'sample-post-computers-and-laptops-6@tijarahjo.local', N'داليا', N'الجهني', N'Computers & Laptops', N'Dell Latitude 5490', 249.99, N'عرض مميز لفترة محدودة
Dell Latitude 5490
جهاز عملي وأداء قوي بتصميم احترافي يناسب العمل والدراسة والاستخدام اليومي.
أداء سريع بمعالج Intel Core i7
تشغيل سلس وتعدد مهام بكفاءة عالية
تصميم متين من فئة الأعمال
مناسب للأعمال المكتبية، الدراسة، والاستخدام المنزلي
السعر: 249.99 دينار أردني
توصيل مجاني لجميع مناطق المملكة
مستعمل أوروبي – كأنه جديد
شامل الوندوز الأصلي والبرامج الاساسية
شنتة لابتوب فاخرة
ماوس وايرليس
الشاحن الاصلي
للطلب والاستفسار: اضغط لإظهار رقم الهاتف 9627955585XX (اتصال / واتساب)
Professional Laptop for Work & Study
Dell Latitude 5490
Powerful performance, durable design, and reliable quality — all at an unbeatable price.
Fast Intel Core i7 Performance
Smooth Multitasking & Daily Use
Solid Build – Business Class Laptop
Perfect for Office, Study & Home Use
Price: 249.99 JD
Free Delivery All Across Jordan
Used European – Like New'),
(N'mobile-phones-and-tablets-1', N'sample-post-mobile-phones-and-tablets-1@tijarahjo.local', N'عبدالله', N'المطيري', N'Mobile Phones & Tablets', N'اقساط بدون دفعه اولى ( ايفون 17 برو Iphone 17 Pro 256GB )', 35.00, N'اقساط ..أقساط .. اقساط .. قسط ( بدون دفعة أولى )
عن طريق
البنك العربي الاسلامي الدولي , البنك الاسلامي الاردني
بنك القاهرة >الاسكان> الاهلي> صفوه> العربي> الاردن>وبنك الاتحاد
صندوق توفير البريد
الجيش العربي
نقابة الصيادلة
نقابة المهندسين الاردنيين, والزراعيين
موظفو الضمان الاجتماعي
جمعية وزارة المالية <متقاعدو الضمان<المتقاعدين العسكريين
موظفو القطاع العام<موظفو المدينة الطبية
* الهواتف جديدة وليست مجددة UN Active
*الهواتف مكفولة سنة كاملة كفالة الوكيل I PHONE
*شركة سرايا للكمبيوتر والالكترونيات
*اوقات الدوام من الساعة 9 صباحا ولغاية الساعة 7 مساءً".
* موقعنا شارع المدينة المنورة بجانب مطعم كنتاكي KFC عمارة رقم 126 الطابق الاول فوق معرض BOSE و فوق معرض بيت التطريز مركز دانا التجاري'),
(N'mobile-phones-and-tablets-2', N'sample-post-mobile-phones-and-tablets-2@tijarahjo.local', N'شيماء', N'العنزي', N'Mobile Phones & Tablets', N'مستعمل بحالة الجديد ايفون 15 بلس بأفضل سعر//IPHONE 15 PLUS USED', 359.00, N'IPHONE 15 PLUS USED

متوفر بذاكرة 128جيجا باسعار تبدا من 359

ومتوفر بذاكرة 256جيجا باسعار تبدا من 409

السعر بحسب نسبة البطارية

متوفر بعدة الوان
----------------------------
العروض الاقوى في المملكة على جميع الأجهزة الخلوية واكسسواراتها

نقطة بيع معتمدة لدى العديد من الوكلاء

وبكفالة 5 سنوات من كليڤر موبايل وبكفالة الوكيل الرسمي

هذا العرض لفترة محدودة أو حتى نفاذ الكمية

يتوفر الدفع عن طريق المحافظ الالكترونيه

يتوفر خدمة الدفع عند الاستلام

موقعنا : عمان - شفا بدران بالقرب من دوار الترخيص

خدمة توصيل متوفرة داخل عمان وجميع المحافظات'),
(N'mobile-phones-and-tablets-3', N'sample-post-mobile-phones-and-tablets-3@tijarahjo.local', N'باسم', N'القحطاني', N'Mobile Phones & Tablets', N'هونر /x7d/ 5G بسعر مميز 256GB', 120.00, N'هونر x7d جديد كفالة الوكيل الرسمي
265 جيجا
8رام
بسعر مميز
x7d 4G 120
x7d 5G 130
المعالج: ثماني النواة Snapdragon 685 تكنولوجيا 6 نانو
التخزين / الرام: 256 جيجا مع 8 جيجا رام
الكاميرا: خلفية مزدوجة 108+2 م.ب / امامية 8 م.ب.
الشاشة: 6.77 بوصة بدقة 720x1610 بكسل بها ثقب
نظام التشغيل: اندرويد 15
البطارية: 6500 مللي أمبير'),
(N'mobile-phones-and-tablets-4', N'sample-post-mobile-phones-and-tablets-4@tijarahjo.local', N'ولاء', N'الزهراني', N'Mobile Phones & Tablets', N'ايفون 13 برو ماكس 128 جيجا ووتر بروف مش مفتوح بحال الوكاله ولا شخط و مكفول مع وصلة شاحن و عظمه', 365.00, N'ايفون 13 برو ماكس 128 جيجا
ووتر بروف مش مفتوح
بحال الوكاله
ولا شخط و مكفول
مع وصلة شاحن و عظمه
السعر شامل التوصيل
365دينارايفون 13 برو ماكس 128 جيجا
ووتر بروف مش مفتوح
بحال الوكاله
ولا شخط و مكفول
مع وصلة شاحن و عظمه
السعر شامل التوصيل
365'),
(N'mobile-phones-and-tablets-5', N'sample-post-mobile-phones-and-tablets-5@tijarahjo.local', N'حسام', N'العسيري', N'Mobile Phones & Tablets', N'Brand one mobile', 985.00, N'Brand One iPhones
iPhone 17 Pro Max-512GB
اللون : برتقالي
حالة البطارية: 100%
حالة الجهاز - ممتاز (لا نقور ، لا اعطال)
يرفق مع كل جهاز فاتورة اعتماد +
شاحن معتمد - مكفول 12 شهرا مجانا
بكج حماية - لاصق + كفر حماية مجانا
كفالة النظام و الاعطال التقنية - 12 شهر مجانا
كفالة اداء البطارية - 3 اشهر مجانا
كفالة استبدال الجهاز - مجانا لاول اسبوع
خدمة التوصيل متوفرة و لجميع محافظات المملكة
براند ون موبايل اربد - دوار الجامعه- اليرموك مول'),
(N'mobile-phones-and-tablets-6', N'sample-post-mobile-phones-and-tablets-6@tijarahjo.local', N'رنا', N'البلوي', N'Mobile Phones & Tablets', N'جديد مختوم كفالة الوكيل Galaxy S25 Ultra متوفر لدى سبيد سيل', 719.00, N'Galaxy S25 Ultra
256GB - 12GB Ram
كفالة الوكيل BMS . مع ضمان كسر الشاشة .
بسعر مميز 719 دينار فقط .

سبيد سيل
نقطة بيع معتمدة لجميع وكلاء الاردن منذ عام 2003 . بادارة يامن
كفالة الوكيل الرسمي في الأردن
موقعنا :
عمان - الدوار السابع - شارع شهداء الحرم الابراهيمي DHL -بجانب البنك الاهلي مباشرة -عمارة 8
أوقات الدوام :
من الساعة 10 ظهرا
إلى الساعة 11 ليلا
عدا يوم الجمعة:
من الساعة 4 عصرا
إلى الساعة 10 ليلا'),
(N'mobile-phones-and-tablets-7', N'sample-post-mobile-phones-and-tablets-7@tijarahjo.local', N'وليد', N'الشهري', N'Mobile Phones & Tablets', N'IPAD PRO M5 ( 256GB ) NEW /// ايباد برو ام 5 ذاكره 256 الجديد', 695.00, N'IPAD PRO M5 ( 256GB ) NEW
آيباد برو ام 5 ذاكرة 256 الجديد
( تابع الاحكام والشروط )
( احصل على خصم يصل الى 35٪ على جميع الاكسسوار )
( يوجد أمريكي / ويوجد اوربي / ويوجد هندي / ويوجد شرق أوسط )



العروض الافخم و الاقوى على مستواى المملكة

منافسه لافضل سعر للمستهلك

جميع الاجهزه المستعمله كفاله المحل لمده 4 سنوات

افضل خدمة ما بعد البيع

متوفر خدمة التوصيل

متوفر خدمه الدفع عن طريق المحافظ الألكترونيه

متوفر خدمه التوصيل للمحافظات

متوفر خدمه الدفع عند الاستلام

متوفر خدمه الاقساط عن طريق البنوك الاسلاميه
1 _ البنك العربي الاسلامي
2_ الاسلامي الاردني
3_ صفوة الاسلامي
4 _ بنك القاهرة

يمكنك التوصل معنا عند طريق الواتساب'),
(N'mobile-phones-and-tablets-8', N'sample-post-mobile-phones-and-tablets-8@tijarahjo.local', N'سلمى', N'العمري', N'Mobile Phones & Tablets', N'APPLE WATCH S10 ( 46M ) NEW /// ساعه ابل الجيل 10 مقاس 46 ملي الجديد', 259.00, N'العروض الافخم و الاقوى على مستواى المملكة

منافسه لافضل سعر للمستهلك'),
(N'vehicles-1', N'sample-post-vehicles-1@tijarahjo.local', N'محمد', N'الطويل', N'Vehicles', N'مازدا CX-9 GT', 23500.00, N'مازدا CX-9 2021 وارد وصيانه تحت كفاله شركه الخياط مالك اول فل كامل فحص كامل عداد قليل بحاله الوكاله
Mazda CX-9 2021 SKYACTIV G
الآن لدى معرض ثالث الحرمين - Thalith Al-Harmin

#مازدا #CX-9 موديل2021 عداد قليل وارد وصيانه شركه الخياط وتحت كفاله الوكالة

السعر : 23.500 الف
اللون : فيراني ميتاليك
عداد : 60 الف كيلو
محرك : 2500cc توين تيربو
الفحص : كامل ولا اي ملاحظه

الاضافات:
* فتحة سقف
* جير أوتوماتيك - تيبترونيك
* عدة أنظمة قيادة: EV / ECO / Normal / Sport
* هاند بريك كهربائي مع نظام أوتوهولد
* مقاعد جلدية فاخرة: كهربائية
* شاشة لمس مع نظام ملاحة
* منافذ USB، بلوتوث، ونقطة اتصال Wi-Fi، راديو HD
* نظام Smart Device Link
* كاميرا خلفية
* حساسات اصطفاف خلفية واماميه
* تشغيل ودخول بدون مفتاح (Keyless Go & Entry)
* نظام مراقبة النقاط العمياء Blind Spot Monitor
* نظام تغيير السرعات من المقود Paddle Shifters
* عجلة قيادة كهربائية مع تحكم كامل وأوامر صوتية
* ماوس للتحكم بالشاشة
* 7 ركاب عائلي
* نظام مانع للانزلاق ومثبت سرعة ذكي
* نظام الكبح التلقائي في حالات الطوارئ
* أضويه زينون - Matrix LED headlights - كشافات
* اضويه ليد نهارية Daytime running lights
* اضويه أمامية وخلفية ليد
* جنوط قياس 17 انش
* مرايا كهربائية مع إشارات انعطاف
* وسائد هوائية
والعديد من الاضافات لم تذكر

موقعنا دوار المدينه الرياضيه _ شارع صرح الشهيد مقابل البنك الأردني الكويتي

للاستفسار ضمن اوقات الدوام الرسمي من 9ص وحتى 10م عن طريق الاتصال بالهاتف او عن طريق واتساب في اقرب وقت في خدمتكم :'),
(N'vehicles-2', N'sample-post-vehicles-2@tijarahjo.local', N'إبراهيم', N'الوهيبي', N'Vehicles', N'دايهاتسو كوبن', 8900.00, N'دايهاتسو كوبن 2007 كاملة الأضافات جير عادي مميزة جدا كشف هاردتوب وحدة من 2 بل مملكة كاش او اقساط
Daihatsu Copen 2007

دايهاتسو كوبن موديل 2007

وارد الشركة

محرك 4 سلندر سعة 1300 سي سي دفع امامي قوي و اقتصادي

جير عادي 5 غيار

كاملة الأضافات :

كشف هاردتوب كهرباء - مقاعد جلد طبيعي مدفأة - شاشة - مري كهرباء - Airbag - Abs - مكيف - سنترلوك - صندوق خلفي كهرباء شفط - زجاج كهرباء - bluetooth - جنطات كروم - كشافات امامية - كشاف خلفي للضباب - مفتاح ريموت - سبويلر خلفي - و العديد من الأضافات الأخرى

المركبة مميزة جداً واحدة من اصل 2 بل مملكة

المركبة بحالة ممتازة

لا تحتاج الى نوع من أنواع الصيانة

رسوم ترخيص سنوي 40 دينار رسوم نقل ملكية 100 دينار فقط

امكانية التقسيط عن طريق المعرض مباشرة

قطع الميكانيك من شركة تويوتا و متوفرة

امكانية البيع مع الرقم المميز او بدون

امكانية البدل متوفرة لدينا

السعر على الأقساط دفعة اولى 3800
600 شهري لمدة سنة - تنازل و رهن


معرض المدينة للسيارات City Car


المدينة الرياضية مقابل صرح الشهيد

#المدينة_للسيارات'),
(N'vehicles-3', N'sample-post-vehicles-3@tijarahjo.local', N'ماجد', N'الكثيري', N'Vehicles', N'لينكولن MKZ Black Label', 10700.00, N'لينكون Mkz لون ابيض لؤلؤي فحص 3جيد فل الفل بانوراما لمتيد أعلى صنف بسعر مغري قابل للبدل
ماتور 2000 قوي واقتصادي دهان نظيف مشيه نخب قير جديد 2019 راكب قبل شهر كلف 1000 دينار تحت الكفاله فل الفل بانوراما جلد لون بني مميز جنط 19 سياره بالكرتونه واقتصاديه وعديد العديد من الاضافات كلو مرفق بالصور .خصوصي اصلي لم تعمل عالتطبيقات'),
(N'vehicles-4', N'sample-post-vehicles-4@tijarahjo.local', N'أسماء', N'الرويلي', N'Vehicles', N'ميني كونتريمان Cooper S', 13750.00, N'ميني كوبر كانتريمان S مميزة جدا و بحالة الوكالة لونين مع سقف بانوراما و فحص كامل 7 جيد بسعر مغري
مني كنتريمان كوبر S
• موديل :- 2014
• محرك :- 1.6 تيربو.
• المسافة المقطوعة :- 129,000 كم.
• اللون :- اسود من الداخل أسود.
• فحص كامل .

الإضافات :-
• جير اوتوماتيك تربترونك.
• سقف بانوراما.
• مكيف .
• بلوتوث .
• تحكم ستيرنج .
• ركاية وسط .
• قفل مركزي .
• كراسي جلد وقماش.
• جير شفتر.
• مري طوي.
• مفتاحين ريموت .
• جنطات ألمنيوم.
• أي يو أكس .
• يو إس بي .
• بخاخات اضوية .
• أضوية زينون .
• دبل اكزوزت .
• إنارة داخلية بعدة ألوان .
• كبسة تحويل سبورت .
• زجاج أمامي خلفي كهرباء.
• حساسات .
• كشافات أمامية.
• ساوند سستم .
• مري كهربا.
• جهاز إنذار .
• اوتو لايت .
• مانع إنزلاق.
• بصمة تشغيل .
• حساس مطر .
• سي دي.
• شعارات COOPER S على الجنحان والمرشات.
• تمشي بالتنكة 180 كم.
• مرخصة لغاية شهر 11/2026
• صيانة كاملة ليست بحاجة لأي شيئ..'),
(N'vehicles-5', N'sample-post-vehicles-5@tijarahjo.local', N'نايف', N'الحمدان', N'Vehicles', N'ماهيندرا KUV100 NXT K6+', 1470.00, N'Mahindra Kuv 2024 امتلكها الان بدفعة اولى 1470 دينار تسليم مفتاح
امتلكها الان من الوكيل ، بدفعة اولى 1470 دينار تسليم مفتاح بالتعاون مع شركة السماحة للتمويل الاسلامي و بقسط شهري 192 دينار

Mahindra Kuv 2024

السيارة وارد و كفالة الوكيل ( شركة جميل عودة و اولاده ) 3 سنوات او 100,000 كيلو متر ايهما اسبق

محرك :
1200 سي سي
بنزين

تقطع بالتنكة 370 كيلو متر

الالوان المتوفرة : سلفر / احمر


المواصفات : جير عادي 5 غيار/ مكيف هواء/ تحكم طارة/ اضوية امامية Led/ كشافات ضباب امامية/ حساسات اصطفاف خلفية/ بلوتوث/ زجاج و مري كهرباء/ جنط المنيوم / ايرباج/ بريك Abs
s'),
(N'vehicles-6', N'sample-post-vehicles-6@tijarahjo.local', N'غادة', N'الصاعدي', N'Vehicles', N'نيسان باترول LE', 44800.00, N'نيسان باترول 2023 تحت كفاله الشركه بسطامي مالك اول V6 فحص كامل فل كامل بحاله الوكاله
Nissan Patrol 2023 V6
الآن لدى معرض ثالث الحرمين - Thalith Al-Harmin
جيب نيسان باترول 2023

(وارد وصيانه شركه بسطامي وصاحب تحت كفاله الشركه مالك اول )

السعر : 44.800 الف
عداد : 96 الف كيلو
اللون : اسود من داخل بيج
محرك : 4000cc V6
فحص : كامل ولا اي ملاحظه

(ملاحظه تحت كفاله شركه بسطامي)

الاضافات :
فتحة سقف/ شاشة امامية/ كاميرا خلفية/ حساسات اصطفاف امامية و خلفية /كراسي جلد بيج وكهرباء/اضوية امامية زينون/ اضوية Led / 7 مقاعد / فورمايكا داخلية/ لوحة تحكم خلفية للمكيف/ كشافات ضباب امامية/ شاشة معلومات/ صندوق خلفي كهرباء / ثلاجة بالوسط/ بصمة تشغيل و دخول/ شاشة معلومات امامية/ دفع رباعي بوضعيات متعددة / عداد ديجيتال/ شاشة للتحكم بانظمة المكيف / ماوس للتحكم بالشاشة / تشغيل عن بعد

Bose sound system نظام صوتي
Airbags وسائد هوائية
Bluetooth بلوتوث
Voice command داعم
اوامر صوتية
والعديد من الاضافات...

موقعنا دوار المدينه الرياضيه _ شارع صرح الشهيد مقابل البنك الأردني الكويتي

للاستفسار ضمن اوقات الدوام الرسمي من 10 ص حتى 12 م عن طريق الاتصال بالهاتف او عن طريق واتساب في اقرب وقت في خدمتكم'),
(N'vehicles-7', N'sample-post-vehicles-7@tijarahjo.local', N'علي', N'الزبيدي', N'Vehicles', N'مرسيدس بنز الفئة-A A 250', 18000.00, N'مرسيدس A250 Sport 2015، ماشية 17 الف كيلو بحالة الوكالة 7 جيد
للبيع لاسباب شخصية: Mercedes-Benz A250 Sport موديل 2015
اللون: أزرق فاتح ميتاليك مميز
الحالة: استعمال محدود جدا
ماشية فقط:17,000 كم
بحالة الوكالة
مالك واحد فقط
خالية من الحوادث
وارد الوكالة السعودية
استخدام شخصي من طبيب متقاعد مع اهتمام وصيانة دورية
تم تغيير:
زيت المحرك بشكل دوري مع الفلتر
البطارية
باقي السيارة على حالتها الأصلية من الوكالة، جاهزة للفحص بأي مركز

معلومات المركبة:

محرك: 4 سلندر تيربو 2.0 لتر
القوة: 211 حصان (أداء قوي وسحب ممتاز)
ناقل الحركة: أوتوماتيك 7 سرعات (Dual Clutch) كلتش ثنائي سلس
شيفتر على المقود (Paddle Shifters) (شفتات الطارة)
وضع Economic لتوفير الوقود
قيادة ناعمة وثبات عالي على السرعات'),
(N'vehicles-8', N'sample-post-vehicles-8@tijarahjo.local', N'تهاني', N'المالكي', N'Vehicles', N'لاند روفر رينج روفر Vogue', 30000.00, N'تاجير رينج روفر فوج /سبورت / دفندر موديل للايجار 2025/2022بأفضل الاسعار اقوى العروض
تأجير جميع انواع السيارات الفارهه 2025 استقبال من والى المطار والجسور والمعابر تجهيز جميع المؤتمرات خدمه رجال اعمال خدمه سائق خدمه vipدقه بل عمل وفي المواعيد لسنا الواحدون ولكننا المميزون
Zaid rent a car');

;WITH NumberedSamplePosts AS
(
    SELECT
        SourceKey,
        ROW_NUMBER() OVER (ORDER BY SourceKey) AS RowNumber
    FROM #SamplePosts
)
UPDATE sp
SET
    CityName = CASE (numbered.RowNumber % 10)
        WHEN 0 THEN N'Amman'
        WHEN 1 THEN N'Irbid'
        WHEN 2 THEN N'Zarqa'
        WHEN 3 THEN N'Aqaba'
        WHEN 4 THEN N'Balqa'
        WHEN 5 THEN N'Madaba'
        WHEN 6 THEN N'Amman'
        WHEN 7 THEN N'Irbid'
        WHEN 8 THEN N'Zarqa'
        WHEN 9 THEN N'Aqaba'
    END,
    AreaName = CASE (numbered.RowNumber % 10)
        WHEN 0 THEN N'West Amman'
        WHEN 1 THEN N'City Center'
        WHEN 2 THEN N'New Zarqa'
        WHEN 3 THEN N'Tala Bay'
        WHEN 4 THEN N'Salt'
        WHEN 5 THEN N'City Center'
        WHEN 6 THEN N'Abdali'
        WHEN 7 THEN N'Al Ramtha'
        WHEN 8 THEN N'Russeifa'
        WHEN 9 THEN N'South Beach'
    END,
    Phone = N'079' + RIGHT(N'0000000' + CONVERT(NVARCHAR(7), numbered.RowNumber), 7)
FROM #SamplePosts AS sp
INNER JOIN NumberedSamplePosts AS numbered
    ON numbered.SourceKey = sp.SourceKey;

INSERT INTO #SampleImages
    (SourceKey, PostImageURL, SortOrder)
VALUES
(N'books-and-stationery-1', N'/uploads/post-images/sample-books-and-stationery-1-8e7c1b18ae9b.webp', 1),
(N'books-and-stationery-1', N'/uploads/post-images/sample-books-and-stationery-1-62d3068a4580.webp', 2),
(N'books-and-stationery-1', N'/uploads/post-images/sample-books-and-stationery-1-1407b1a49bdb.webp', 3),
(N'books-and-stationery-1', N'/uploads/post-images/sample-books-and-stationery-1-288811358e26.webp', 4),
(N'books-and-stationery-1', N'/uploads/post-images/sample-books-and-stationery-1-fb2e568ef992.webp', 5),
(N'books-and-stationery-2', N'/uploads/post-images/sample-books-and-stationery-2-03cc50c4ec82.webp', 1),
(N'books-and-stationery-2', N'/uploads/post-images/sample-books-and-stationery-2-8a063faf0216.webp', 2),
(N'books-and-stationery-2', N'/uploads/post-images/sample-books-and-stationery-2-efc4a5ab7f15.webp', 3),
(N'books-and-stationery-3', N'/uploads/post-images/sample-books-and-stationery-3-4fb6113578a2.webp', 1),
(N'books-and-stationery-3', N'/uploads/post-images/sample-books-and-stationery-3-7c676156d4c9.webp', 2),
(N'books-and-stationery-3', N'/uploads/post-images/sample-books-and-stationery-3-7ca462a1338d.webp', 3),
(N'books-and-stationery-3', N'/uploads/post-images/sample-books-and-stationery-3-58c62e3e6b0c.webp', 4),
(N'books-and-stationery-3', N'/uploads/post-images/sample-books-and-stationery-3-d8d5e4c4d6c7.webp', 5),
(N'books-and-stationery-4', N'/uploads/post-images/sample-books-and-stationery-4-3d5a948f09fa.webp', 1),
(N'books-and-stationery-4', N'/uploads/post-images/sample-books-and-stationery-4-d5bead8c1f2e.webp', 2),
(N'books-and-stationery-4', N'/uploads/post-images/sample-books-and-stationery-4-e97c4cee550a.webp', 3),
(N'books-and-stationery-4', N'/uploads/post-images/sample-books-and-stationery-4-ed269e46663c.webp', 4),
(N'books-and-stationery-4', N'/uploads/post-images/sample-books-and-stationery-4-fddc57f80560.webp', 5),
(N'books-and-stationery-5', N'/uploads/post-images/sample-books-and-stationery-5-efa49f2f2b04.webp', 1),
(N'books-and-stationery-5', N'/uploads/post-images/sample-books-and-stationery-5-f56582c0bb6e.webp', 2),
(N'books-and-stationery-6', N'/uploads/post-images/sample-books-and-stationery-6-2ad665a7d863.webp', 1),
(N'books-and-stationery-6', N'/uploads/post-images/sample-books-and-stationery-6-6afc2fd1055f.webp', 2),
(N'books-and-stationery-6', N'/uploads/post-images/sample-books-and-stationery-6-3733bdf3f8b8.webp', 3),
(N'books-and-stationery-6', N'/uploads/post-images/sample-books-and-stationery-6-7976b521bb56.webp', 4),
(N'books-and-stationery-6', N'/uploads/post-images/sample-books-and-stationery-6-d1f956befc8a.webp', 5),
(N'books-and-stationery-7', N'/uploads/post-images/sample-books-and-stationery-7-5a02d5c070bf.webp', 1),
(N'books-and-stationery-7', N'/uploads/post-images/sample-books-and-stationery-7-44ba97be6ae7.webp', 2),
(N'books-and-stationery-7', N'/uploads/post-images/sample-books-and-stationery-7-b025f95e799a.webp', 3),
(N'books-and-stationery-7', N'/uploads/post-images/sample-books-and-stationery-7-e0cfacf75ffc.webp', 4),
(N'books-and-stationery-8', N'/uploads/post-images/sample-books-and-stationery-8-9a50fb7af466.webp', 1),
(N'computers-and-laptops-1', N'/uploads/post-images/sample-computers-and-laptops-1-a8b7146e7fa6.webp', 1),
(N'computers-and-laptops-2', N'/uploads/post-images/sample-computers-and-laptops-2-09bc895788dd.webp', 1),
(N'computers-and-laptops-2', N'/uploads/post-images/sample-computers-and-laptops-2-192aa6f2245b.webp', 2),
(N'computers-and-laptops-2', N'/uploads/post-images/sample-computers-and-laptops-2-d0a28a4083bc.webp', 3),
(N'computers-and-laptops-2', N'/uploads/post-images/sample-computers-and-laptops-2-f28927651ac1.webp', 4),
(N'computers-and-laptops-3', N'/uploads/post-images/sample-computers-and-laptops-3-1a10d846b7a9.webp', 1),
(N'computers-and-laptops-3', N'/uploads/post-images/sample-computers-and-laptops-3-1e9d3907de53.webp', 2),
(N'computers-and-laptops-3', N'/uploads/post-images/sample-computers-and-laptops-3-52066efbbfce.webp', 3),
(N'computers-and-laptops-4', N'/uploads/post-images/sample-computers-and-laptops-4-846633a0f9f0.webp', 1),
(N'computers-and-laptops-5', N'/uploads/post-images/sample-computers-and-laptops-5-e4d6c4f8f92f.webp', 1),
(N'computers-and-laptops-6', N'/uploads/post-images/sample-computers-and-laptops-6-022538ed1030.webp', 1),
(N'mobile-phones-and-tablets-1', N'/uploads/post-images/sample-mobile-phones-and-tablets-1-58e2ff2c0f36.webp', 1),
(N'mobile-phones-and-tablets-2', N'/uploads/post-images/sample-mobile-phones-and-tablets-2-28fa3f706119.webp', 1),
(N'mobile-phones-and-tablets-3', N'/uploads/post-images/sample-mobile-phones-and-tablets-3-8f7052e36c3b.webp', 1),
(N'mobile-phones-and-tablets-3', N'/uploads/post-images/sample-mobile-phones-and-tablets-3-30a41005081d.webp', 2),
(N'mobile-phones-and-tablets-4', N'/uploads/post-images/sample-mobile-phones-and-tablets-4-0d380a89096d.webp', 1),
(N'mobile-phones-and-tablets-4', N'/uploads/post-images/sample-mobile-phones-and-tablets-4-509da03e5188.webp', 2),
(N'mobile-phones-and-tablets-5', N'/uploads/post-images/sample-mobile-phones-and-tablets-5-6dfbd5fb2d23.webp', 1),
(N'mobile-phones-and-tablets-5', N'/uploads/post-images/sample-mobile-phones-and-tablets-5-ca4a4856ec32.webp', 2),
(N'mobile-phones-and-tablets-6', N'/uploads/post-images/sample-mobile-phones-and-tablets-6-42f7924e3142.webp', 1),
(N'mobile-phones-and-tablets-6', N'/uploads/post-images/sample-mobile-phones-and-tablets-6-647bcd2e872a.webp', 2),
(N'mobile-phones-and-tablets-7', N'/uploads/post-images/sample-mobile-phones-and-tablets-7-804f40a12266.webp', 1),
(N'mobile-phones-and-tablets-8', N'/uploads/post-images/sample-mobile-phones-and-tablets-8-0d4ece60f81a.webp', 1),
(N'vehicles-1', N'/uploads/post-images/sample-vehicles-1-1be4043eb080.webp', 1),
(N'vehicles-1', N'/uploads/post-images/sample-vehicles-1-8a2c8dbf5207.webp', 2),
(N'vehicles-1', N'/uploads/post-images/sample-vehicles-1-72d6b86c3ad7.webp', 3),
(N'vehicles-1', N'/uploads/post-images/sample-vehicles-1-738c04bf4247.webp', 4),
(N'vehicles-1', N'/uploads/post-images/sample-vehicles-1-f0ce92c024f1.webp', 5),
(N'vehicles-2', N'/uploads/post-images/sample-vehicles-2-685f0683dc7e.webp', 1),
(N'vehicles-2', N'/uploads/post-images/sample-vehicles-2-a52896cf4a2b.webp', 2),
(N'vehicles-2', N'/uploads/post-images/sample-vehicles-2-ab1e4df8e9c4.webp', 3),
(N'vehicles-2', N'/uploads/post-images/sample-vehicles-2-ad8de083a1ce.webp', 4),
(N'vehicles-3', N'/uploads/post-images/sample-vehicles-3-3a9d22ff4e08.webp', 1),
(N'vehicles-3', N'/uploads/post-images/sample-vehicles-3-33e03a41ee2a.webp', 2),
(N'vehicles-3', N'/uploads/post-images/sample-vehicles-3-e0b0bfb82c0e.webp', 3),
(N'vehicles-3', N'/uploads/post-images/sample-vehicles-3-efce5eabef80.webp', 4),
(N'vehicles-4', N'/uploads/post-images/sample-vehicles-4-83e0241f34db.webp', 1),
(N'vehicles-4', N'/uploads/post-images/sample-vehicles-4-bc2f3720c1f7.webp', 2),
(N'vehicles-5', N'/uploads/post-images/sample-vehicles-5-14d8adf458c3.webp', 1),
(N'vehicles-5', N'/uploads/post-images/sample-vehicles-5-8408a7b73cdb.webp', 2),
(N'vehicles-6', N'/uploads/post-images/sample-vehicles-6-68aecd81a41f.webp', 1),
(N'vehicles-6', N'/uploads/post-images/sample-vehicles-6-732705a6b851.webp', 2),
(N'vehicles-7', N'/uploads/post-images/sample-vehicles-7-30dab575c252.webp', 1),
(N'vehicles-7', N'/uploads/post-images/sample-vehicles-7-27369d9fc5c8.webp', 2),
(N'vehicles-8', N'/uploads/post-images/sample-vehicles-8-a8b92afe4968.webp', 1),
(N'vehicles-8', N'/uploads/post-images/sample-vehicles-8-d553e081d7f7.webp', 2);

IF EXISTS
(
    SELECT 1
    FROM #SamplePosts AS sp
    LEFT JOIN dbo.Categories AS c
        ON c.CategoryName = sp.CategoryName
       AND c.IsDeleted = 0
    WHERE c.CategoryID IS NULL
)
BEGIN
    DECLARE @MissingCategories NVARCHAR(MAX) =
        STUFF((
            SELECT DISTINCT N', ' + sp.CategoryName
            FROM #SamplePosts AS sp
            LEFT JOIN dbo.Categories AS c
                ON c.CategoryName = sp.CategoryName
               AND c.IsDeleted = 0
            WHERE c.CategoryID IS NULL
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, N'');

    THROW 51000, @MissingCategories, 1;
END;

IF EXISTS
(
    SELECT 1
    FROM #SamplePosts AS sp
    LEFT JOIN dbo.Cities AS ct
        ON ct.CityName = sp.CityName
    LEFT JOIN dbo.Areas AS a
        ON a.CityID = ct.CityID
       AND a.AreaName = sp.AreaName
    WHERE ct.CityID IS NULL
       OR a.AreaID IS NULL
)
BEGIN
    DECLARE @MissingLocations NVARCHAR(MAX) =
        STUFF((
            SELECT DISTINCT N', ' + sp.CityName + N' / ' + sp.AreaName
            FROM #SamplePosts AS sp
            LEFT JOIN dbo.Cities AS ct
                ON ct.CityName = sp.CityName
            LEFT JOIN dbo.Areas AS a
                ON a.CityID = ct.CityID
               AND a.AreaName = sp.AreaName
            WHERE ct.CityID IS NULL
               OR a.AreaID IS NULL
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, N'');

    THROW 51002, @MissingLocations, 1;
END;

DECLARE @UserRoleID INT = (SELECT TOP (1) RoleID FROM dbo.Roles WHERE RoleName = N'User' AND IsDeleted = 0 ORDER BY RoleID);
IF @UserRoleID IS NULL
BEGIN
    THROW 51001, 'User role was not found.', 1;
END;

MERGE dbo.Users AS target
USING
(
        SELECT DISTINCT
            UserEmail,
            Phone,
            FirstName,
            LastName,
            ct.CityID,
        a.AreaID
    FROM #SamplePosts AS sp
    INNER JOIN dbo.Cities AS ct
        ON ct.CityName = sp.CityName
    INNER JOIN dbo.Areas AS a
        ON a.CityID = ct.CityID
       AND a.AreaName = sp.AreaName
) AS source
ON target.Email = source.UserEmail
WHEN MATCHED THEN
    UPDATE SET
        target.FirstName = source.FirstName,
        target.LastName = source.LastName,
        target.Phone = source.Phone,
        target.CityID = source.CityID,
        target.AreaID = source.AreaID,
        target.Status = 1,
        target.RoleID = @UserRoleID,
        target.IsDeleted = 0,
        target.IsEmailVerified = 1,
        target.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED BY TARGET THEN
    INSERT
        (HashedPassword, Email, FirstName, LastName, Phone, CityID, AreaID, JoinDate, UpdatedAt, Status, RoleID, IsDeleted, IsEmailVerified)
    VALUES
        (N'DISABLED_FAKE_SAMPLE_USER', source.UserEmail, source.FirstName, source.LastName, source.Phone, source.CityID, source.AreaID, SYSUTCDATETIME(), SYSUTCDATETIME(), 1, @UserRoleID, 0, 1);

MERGE dbo.Posts AS target
USING
(
    SELECT
        sp.SourceKey,
        u.UserID,
        c.CategoryID,
        sp.PostTitle,
        sp.PostDescription,
        sp.Price,
        ct.CityID,
        a.AreaID
    FROM #SamplePosts AS sp
    INNER JOIN dbo.Users AS u
        ON u.Email = sp.UserEmail
       AND u.IsDeleted = 0
    INNER JOIN dbo.Categories AS c
        ON c.CategoryName = sp.CategoryName
       AND c.IsDeleted = 0
    INNER JOIN dbo.Cities AS ct
        ON ct.CityName = sp.CityName
    INNER JOIN dbo.Areas AS a
        ON a.CityID = ct.CityID
       AND a.AreaName = sp.AreaName
) AS source
ON target.UserID = source.UserID
AND target.IsDeleted = 0
WHEN MATCHED THEN
    UPDATE SET
        target.CategoryID = source.CategoryID,
        target.PostTitle = source.PostTitle,
        target.PostDescription = source.PostDescription,
        target.Price = source.Price,
        target.CityID = source.CityID,
        target.AreaID = source.AreaID,
        target.Status = 0,
        target.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED BY TARGET THEN
    INSERT
        (UserID, CategoryID, PostTitle, PostDescription, Price, CityID, AreaID, Status, CreatedAt, UpdatedAt, IsDeleted, Views)
    VALUES
        (source.UserID, source.CategoryID, source.PostTitle, source.PostDescription, source.Price, source.CityID, source.AreaID, 0, SYSUTCDATETIME(), SYSUTCDATETIME(), 0, 0);

MERGE dbo.PostImages AS target
USING
(
    SELECT
        p.PostID,
        si.PostImageURL,
        si.SortOrder
    FROM #SampleImages AS si
    INNER JOIN #SamplePosts AS sp
        ON sp.SourceKey = si.SourceKey
    INNER JOIN dbo.Users AS u
        ON u.Email = sp.UserEmail
       AND u.IsDeleted = 0
    INNER JOIN dbo.Posts AS p
        ON p.UserID = u.UserID
       AND p.IsDeleted = 0
) AS source
ON target.PostID = source.PostID
AND target.PostImageURL = source.PostImageURL
WHEN MATCHED THEN
    UPDATE SET
        target.IsDeleted = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT
        (PostID, PostImageURL, UploadedAt, IsDeleted)
    VALUES
        (source.PostID, source.PostImageURL, SYSUTCDATETIME(), 0);

COMMIT TRANSACTION;

SELECT
    (SELECT COUNT(*) FROM #SamplePosts) AS ImportedPosts,
    (SELECT COUNT(*) FROM #SampleImages) AS ImportedImages,
    (SELECT COUNT(*) FROM dbo.Users WHERE Email LIKE N'sample-post-%@tijarahjo.local' AND IsDeleted = 0) AS SampleUsersInDatabase,
    (SELECT COUNT(*) FROM dbo.Posts AS p INNER JOIN dbo.Users AS u ON u.UserID = p.UserID WHERE u.Email LIKE N'sample-post-%@tijarahjo.local' AND p.IsDeleted = 0) AS SamplePostsInDatabase,
    (SELECT COUNT(*) FROM dbo.Posts AS p INNER JOIN dbo.Users AS u ON u.UserID = p.UserID WHERE u.Email LIKE N'sample-post-%@tijarahjo.local' AND p.CityID IS NOT NULL AND p.AreaID IS NOT NULL AND p.IsDeleted = 0) AS SamplePostsWithLocation,
    (SELECT COUNT(*) FROM dbo.Posts AS p INNER JOIN dbo.Users AS u ON u.UserID = p.UserID INNER JOIN dbo.Categories AS c ON c.CategoryID = p.CategoryID WHERE u.Email LIKE N'sample-post-%@tijarahjo.local' AND c.CategoryName = N'Books & Stationery' AND p.IsDeleted = 0) AS SampleBookPostsInDatabase;
GO
