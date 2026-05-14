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
    array['自然'], array['浮世绘'], '版画', 1),
  ('11111111-1111-1111-1111-000000000007', '睡莲', '克劳德·莫奈', 1906,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg?width=800',
    '印象派晚期代表系列。',
    array['自然','花鸟'], array['印象派'], '油画', 1),
  ('11111111-1111-1111-1111-000000000018', '芙蓉锦鸡图', '赵佶', 1110,
    'https://commons.wikimedia.org/wiki/Special:FilePath/%E8%B5%B5%E4%BD%B6%E8%8A%99%E8%93%89%E9%94%A6%E9%B8%A1%E5%9B%BE%E8%BD%B4.png?width=800',
    '宋徽宗院体花鸟画代表作，以芙蓉、锦鸡和蝴蝶组织画面。',
    array['花鸟','自然'], array['中国传统'], '国画', 1),
  ('11111111-1111-1111-1111-000000000019', '枇杷山鸟图', '林椿', 1180,
    'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%9E%97%E6%A4%BF%E6%9E%87%E6%9D%B7%E5%B1%B1%E9%B8%9F%E5%9B%BE%E9%A1%B5.png?width=800',
    '南宋小品花鸟画名作，适合讲解折枝构图、留白和细腻设色。',
    array['花鸟','自然'], array['中国传统'], '国画', 1),
  ('11111111-1111-1111-1111-000000000020', '写生珍禽图', '黄筌', 960,
    'https://commons.wikimedia.org/wiki/Special:FilePath/Huang-Quan-Xie-sheng-zhen-qin-tu.jpg?width=800',
    '五代花鸟画代表作，可作为中国花鸟画写生传统和精微观察训练的入门样本。',
    array['花鸟','自然'], array['中国传统'], '国画', 2)
on conflict (id) do update set
  title = excluded.title,
  artist = excluded.artist,
  year = excluded.year,
  image_url = excluded.image_url,
  description = excluded.description,
  theme = excluded.theme,
  style = excluded.style,
  form = excluded.form,
  difficulty = excluded.difficulty;
-- 其他作品按需补齐，演示阶段以 20 件本地数据为准。
