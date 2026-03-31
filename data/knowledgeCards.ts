import { KnowledgeCard } from '../types';

export const KNOWLEDGE_CARDS: KnowledgeCard[] = [
  {
    id: 'adj_decl_weak_dat_mit',
    grammar_topic: '形容词变格',
    grammar_subtopic: '与介词连用',
    grammar_detail: '第三格弱变化',
    rule_summary: '当形容词前面有定冠词时，形容词按弱变化词尾变格。mit 支配第三格，名词性、数、格决定词尾形式。',
    example_sentence: 'Er war mit dem guten Ergebnis sehr zufrieden.',
    key_points: [
      'mit 是支配第三格的介词',
      '定冠词后形容词用弱变化',
      '中性名词第三格弱变化词尾为 -en',
    ],
  },
  {
    id: 'adj_decl_weak_akk_def',
    grammar_topic: '形容词变格',
    grammar_subtopic: '直接宾语',
    grammar_detail: '第四格弱变化',
    rule_summary: '形容词在定冠词后按弱变化变格。第四格弱变化：阳性 -en，中性 -e，阴性 -e，复数 -en。',
    example_sentence: 'Ich sehe den alten Mann.',
    key_points: [
      '定冠词后形容词弱变化',
      '阳性第四格弱变化词尾为 -en',
      '注意区分强变化和弱变化',
    ],
  },
  {
    id: 'adj_decl_strong_ohne',
    grammar_topic: '形容词变格',
    grammar_subtopic: '无冠词',
    grammar_detail: '无冠词强变化',
    rule_summary: '当形容词前没有冠词时，形容词按强变化变格，词尾变化同定冠词 der/die/das。',
    example_sentence: 'Er mag kaltes Wasser.',
    key_points: [
      '无冠词时形容词强变化',
      '中性第四格强变化词尾为 -es',
      '强变化词尾承担格变化的标记功能',
    ],
  },
  {
    id: 'adj_decl_mixed_ein',
    grammar_topic: '形容词变格',
    grammar_subtopic: '不定冠词后',
    grammar_detail: '混合变化',
    rule_summary: '不定冠词 ein/eine 后的形容词按混合变化变格：ein 已体现部分性、数、格信息，后续形容词按剩余信息变化。',
    example_sentence: 'Das ist ein guter Lehrer.',
    key_points: [
      '不定冠词后形容词混合变化',
      '阳性第一格混合变化词尾为 -er',
      '第三个及以后形容词用弱变化',
    ],
  },
  {
    id: 'adj_decl_gen_def',
    grammar_topic: '形容词变格',
    grammar_subtopic: '第二格',
    grammar_detail: '第二格弱变化',
    rule_summary: '形容词在定冠词后第二格弱变化。阳性/中性 -en，阴性 -en，复数 -en。',
    example_sentence: 'Die Farbe des schönen Himmels.',
    key_points: [
      '第二格定冠词后形容词用弱变化',
      '阳性和中性第二格名词自身常加 -es 或 -s',
      '形容词词尾均为 -en',
    ],
  },
];

export function getCardById(id: string): KnowledgeCard | undefined {
  return KNOWLEDGE_CARDS.find((c) => c.id === id);
}

export function getCardByDetail(
  topic: string,
  subtopic: string,
  detail: string
): KnowledgeCard | undefined {
  return KNOWLEDGE_CARDS.find(
    (c) =>
      c.grammar_topic === topic &&
      c.grammar_subtopic === subtopic &&
      c.grammar_detail === detail
  );
}
