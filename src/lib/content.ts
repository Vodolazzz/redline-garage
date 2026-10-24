// Single source for the workshop's offer: used by the landing page, the
// calculator, the booking form and the admin panel. Sample data for the portfolio.

export const BRAND = {
  name: "REDLINE",
  full: "REDLINE — автоателье",
  phone: "+7 495 700-70-00",
  phoneHref: "tel:+74957007000",
  email: "garage@redline7.ru",
  address: "Москва, ул. Электрозаводская, 7, стр. 2",
  hours: "Ежедневно 8:00–22:00",
  legal: "ООО «Редлайн Сервис»",
  inn: "7718000000",
  ogrn: "1257700000000",
}

export type CarClass = "comfort" | "business" | "sport"

export const CAR_CLASSES: { id: CarClass; label: string; hint: string; k: number }[] = [
  { id: "comfort", label: "Комфорт", hint: "Golf, Camry, Octavia, Tiguan", k: 1 },
  { id: "business", label: "Бизнес и SUV", hint: "BMW 5, Mercedes E, Audi Q7, Lexus RX", k: 1.35 },
  { id: "sport", label: "Спорт и премиум", hint: "Porsche 911, Cayenne, AMG GT, M5", k: 1.8 },
]

export interface Service {
  id: string
  group: string
  name: string
  note: string
  price: number // базовая цена, ₽, класс «Комфорт»
  hours: number // норма-часы
}

export const SERVICES: Service[] = [
  { id: "diag", group: "Диагностика", name: "Компьютерная диагностика", note: "Все блоки, live-данные, отчёт с фото и видео", price: 2900, hours: 1 },
  { id: "pretrip", group: "Диагностика", name: "Проверка перед покупкой", note: "Толщиномер, эндоскоп цилиндров, история ошибок", price: 6900, hours: 2.5 },
  { id: "endoscope", group: "Диагностика", name: "Эндоскопия цилиндров", note: "Задиры, нагар, состояние стенок — видео вам в Telegram", price: 3500, hours: 1 },
  { id: "suspension-check", group: "Диагностика", name: "Осмотр ходовой", note: "На подъёмнике, с люфт-детектором", price: 1500, hours: 0.5 },

  { id: "to", group: "Двигатель", name: "Техобслуживание (ТО)", note: "Масло, фильтры, проверка по регламенту завода", price: 9900, hours: 2 },
  { id: "timing", group: "Двигатель", name: "Замена ГРМ / цепи", note: "С меткой на распредвалах и проверкой фаз", price: 24900, hours: 6 },
  { id: "spark", group: "Двигатель", name: "Свечи и катушки", note: "Оригинал или OEM-аналог на выбор", price: 4900, hours: 1.5 },
  { id: "cooling", group: "Двигатель", name: "Система охлаждения", note: "Помпа, термостат, опрессовка", price: 12900, hours: 4 },

  { id: "brakes", group: "Ходовая и тормоза", name: "Тормоза: колодки и диски", note: "Ось целиком, проточка или замена дисков", price: 6900, hours: 1.5 },
  { id: "brake-fluid", group: "Ходовая и тормоза", name: "Замена тормозной жидкости", note: "Прокачка с аппаратом под давлением", price: 2900, hours: 1 },
  { id: "alignment", group: "Ходовая и тормоза", name: "Развал-схождение 3D", note: "Стенд Hunter, протокол до/после", price: 3900, hours: 1 },
  { id: "suspension", group: "Ходовая и тормоза", name: "Ремонт подвески", note: "Рычаги, сайлентблоки, амортизаторы", price: 8900, hours: 3 },

  { id: "electrics", group: "Электрика", name: "Поиск неисправности электрики", note: "Обрывы, утечки тока, CAN-шина", price: 4900, hours: 2 },
  { id: "coding", group: "Электрика", name: "Кодирование и адаптации", note: "Активация функций, адаптация блоков", price: 5900, hours: 1.5 },
  { id: "ac", group: "Электрика", name: "Кондиционер", note: "Заправка, поиск утечек с УФ-красителем", price: 4500, hours: 1 },

  { id: "tires", group: "Шины и кузов", name: "Шиномонтаж R17–R22", note: "Бережная машина без монтажки, балансировка", price: 3600, hours: 1 },
  { id: "storage", group: "Шины и кузов", name: "Сезонное хранение колёс", note: "Мойка, упаковка, стеллаж", price: 6000, hours: 0 },
  { id: "detailing", group: "Шины и кузов", name: "Детейлинг-мойка", note: "Двухфазная, сушка, чернение резины", price: 4900, hours: 2 },
  { id: "polish", group: "Шины и кузов", name: "Полировка и керамика", note: "Абразивная полировка, керамика 2 слоя", price: 39900, hours: 16 },
]

export const SERVICE_GROUPS = Array.from(new Set(SERVICES.map((s) => s.group)))

export function priceFor(service: Service, carClass: CarClass) {
  const k = CAR_CLASSES.find((c) => c.id === carClass)?.k ?? 1
  return Math.round((service.price * k) / 100) * 100
}

export const formatRub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`

export const TIME_SLOTS = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"]

export const MASTERS = [
  { name: "Артём Волков", role: "Двигатель и трансмиссия", since: 2009, makes: "Porsche, Audi, VW" },
  { name: "Ильдар Сафин", role: "Электрика и кодирование", since: 2012, makes: "BMW, MINI, Mercedes" },
  { name: "Сергей Котов", role: "Ходовая и тормоза", since: 2011, makes: "Все марки" },
  { name: "Мария Лебедева", role: "Приёмка и согласование", since: 2016, makes: "Ваш менеджер" },
  { name: "Денис Ермаков", role: "Детейлинг и кузов", since: 2014, makes: "Полировка, керамика" },
]
