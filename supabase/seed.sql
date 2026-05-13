-- Run after 0001_init.sql to seed the demo library.
-- 注：与 lib/artworks-data.ts 中的 SEED_ARTWORKS 保持一致，方便切换数据源时不丢东西。

insert into public.artworks (id, title, artist, year, image_url, description, theme, style, form, difficulty) values
  ('11111111-1111-1111-1111-000000000001', '蒙娜丽莎', '列奥纳多·达·芬奇', 1503,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa.jpg?width=800',
    '文艺复兴时期最具代表性的肖像之一，卢浮宫镇馆之宝。',
    array['人物'], array['文艺复兴'], '油画', 2),
  ('11111111-1111-1111-1111-000000000002', '星月夜', '文森特·梵高', 1889,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=800',
    '后印象派标志性作品。',
    array['自然','梦境'], array['后印象派'], '油画', 2),
  ('11111111-1111-1111-1111-000000000003', '神奈川冲浪里', '葛饰北斋', 1831,
    'https://commons.wikimedia.org/wiki/Special:FilePath/The_Great_Wave_off_Kanagawa.jpg?width=800',
    '浮世绘版画的代表作。',
    array['自然'], array['中国传统'], '版画', 1),
  ('11111111-1111-1111-1111-000000000007', '睡莲', '克劳德·莫奈', 1906,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg?width=800',
    '印象派晚期代表系列。',
    array['自然','花鸟'], array['印象派'], '油画', 1)
on conflict (id) do nothing;
-- 其他作品按需补齐，演示阶段以 17 件本地数据为准。
