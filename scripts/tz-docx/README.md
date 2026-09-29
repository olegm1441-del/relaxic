# Сборка ТЗ в Word

Документ `docs/Relaxic-TZ-3.0.docx` собирается отсюда, а не правится руками:
цифры каталога, версии стека и реквизиты берутся из проекта.

```bash
cd scripts/tz-docx
npm install        # ставит только docx, в зависимости сайта не попадает
npm run build      # кладёт docs/Relaxic-TZ-3.0.docx
```

Файлы:

| Файл | Что внутри |
|---|---|
| `kit.js` | Оформление: палитра бренд-бука на белой бумаге, таблицы, врезки, заголовки |
| `part1.js` | Обложка, содержание, разделы 01–04 |
| `part2.js` | Разделы 05–09 |
| `part3.js` | Разделы 10–15 |
| `part4.js` | Разделы 16–20 |
| `part5.js` | Раздел 21 и сборка документа |

Посмотреть результат картинками (нужен LibreOffice Writer и poppler):

```bash
soffice --headless --convert-to pdf docs/Relaxic-TZ-3.0.docx
pdftoppm -jpeg -r 90 Relaxic-TZ-3.0.pdf page
```
