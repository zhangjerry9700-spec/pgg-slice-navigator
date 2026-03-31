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
  // 形容词变格补充卡片
  {
    id: 'adj_decl_weak_dat_verb',
    grammar_topic: '形容词变格',
    grammar_subtopic: '与动词连用',
    grammar_detail: '第三格弱变化',
    rule_summary: '支配第三格的动词（helfen, danken, antworten等）后，形容词按弱变化变格。',
    example_sentence: 'Wir helfen dem kranken Kind.',
    key_points: [
      'helfen/danken 等动词支配第三格',
      '定冠词后形容词用弱变化',
      '中性第三格弱变化词尾为 -en',
    ],
  },
  {
    id: 'adj_decl_weak_dat_prep',
    grammar_topic: '形容词变格',
    grammar_subtopic: '与介词连用',
    grammar_detail: '第三格弱变化',
    rule_summary: '支配第三格的介词（mit, bei, unter, auf等）后，形容词按弱变化变格。',
    example_sentence: 'Das Buch liegt auf dem großen Tisch.',
    key_points: [
      'mit, bei, unter, auf (静态) 支配第三格',
      '定冠词后形容词用弱变化',
      '注意区分动态/静态',
    ],
  },
  {
    id: 'adj_decl_weak_akk_prep',
    grammar_topic: '形容词变格',
    grammar_subtopic: '与介词连用',
    grammar_detail: '第四格弱变化',
    rule_summary: '支配第四格的介词（für, durch, um, gegen等）后，形容词按弱变化变格。',
    example_sentence: 'Er denkt oft an die schöne Zeit.',
    key_points: [
      'an 表示动态方向时支配第四格',
      'an 表示静态位置时支配第三格',
      '定冠词后形容词用弱变化',
    ],
  },
  {
    id: 'adj_decl_possessive_dat',
    grammar_topic: '形容词变格',
    grammar_subtopic: '物主冠词后',
    grammar_detail: '第三格弱变化',
    rule_summary: '物主冠词（mein, dein, sein等）后形容词按弱变化变格，词尾与定冠词后相同。',
    example_sentence: 'Sie schenkt ihrem kleinen Bruder ein Spielzeug.',
    key_points: [
      '物主冠词后形容词弱变化',
      '物主冠词本身已体现性、数、格',
      '形容词词尾均为 -en（第三格）',
    ],
  },
  {
    id: 'adj_decl_negative_mixed',
    grammar_topic: '形容词变格',
    grammar_subtopic: '否定冠词后',
    grammar_detail: '混合变化',
    rule_summary: '否定冠词 kein/keine 后形容词按混合变化变格，与不定冠词后规则相同。',
    example_sentence: 'Das ist keine gute Lösung.',
    key_points: [
      'kein 相当于 ein 的否定形式',
      'kein 后形容词混合变化',
      '阴性第四格混合变化词尾为 -e',
    ],
  },
  // 被动语态卡片
  {
    id: 'passive_process_present',
    grammar_topic: '被动语态',
    grammar_subtopic: '过程被动态',
    grammar_detail: '现在时',
    rule_summary: '过程被动态（Vorgangspassiv）强调动作过程，现在时构成为：werden + Partizip II。',
    example_sentence: 'Die Straße wird wegen Bauarbeiten gesperrt.',
    key_points: [
      '现在时：werden 的现在时变位 + Partizip II',
      'werden 在主句第二位，Partizip II 在句末',
      '强调动作的执行过程',
    ],
  },
  {
    id: 'passive_process_past',
    grammar_topic: '被动语态',
    grammar_subtopic: '过程被动态',
    grammar_detail: '过去时',
    rule_summary: '过程被动态过去时构成为：wurde(n) + Partizip II，表示过去发生的被动动作。',
    example_sentence: 'Das Haus wurde im Jahr 1900 gebaut.',
    key_points: [
      '过去时：wurde(n) + Partizip II',
      'wurde 是 werden 的过去时形式',
      'Partizip II 仍在句末',
    ],
  },
  {
    id: 'passive_state_present',
    grammar_topic: '被动语态',
    grammar_subtopic: '状态被动态',
    grammar_detail: '现在时',
    rule_summary: '状态被动态（Zustandspassiv）表示动作完成后的状态，构成为：sein + Partizip II。',
    example_sentence: 'Das Problem ist schon gelöst.',
    key_points: [
      '状态被动态：sein + Partizip II',
      '强调动作完成后的结果/状态',
      '与过程被动态的 werden 区分清楚',
    ],
  },
  {
    id: 'passive_state_present_neg',
    grammar_topic: '被动语态',
    grammar_subtopic: '状态被动态',
    grammar_detail: '现在时否定',
    rule_summary: '状态被动态否定形式：ist + noch nicht + Partizip II，表示某事尚未完成。',
    example_sentence: 'Der Brief ist noch nicht geschrieben.',
    key_points: [
      'noch nicht 表示尚未',
      'schon 表示已经',
      '注意 Partizip II 的位置',
    ],
  },
  {
    id: 'passive_future_perfect',
    grammar_topic: '被动语态',
    grammar_subtopic: '过程被动态',
    grammar_detail: '将来时完成式',
    rule_summary: '被动语态将来时完成式：wird + Partizip II + sein，表示将来会完成的动作。',
    example_sentence: 'Die Aufgabe wird morgen erledigt sein.',
    key_points: [
      '将来时完成式很少使用',
      '结构：wird ... Partizip II ... sein',
      '通常用现在时代替',
    ],
  },
  {
    id: 'passive_agent_past',
    grammar_topic: '被动语态',
    grammar_subtopic: '过程被动态',
    grammar_detail: '施事者疑问',
    rule_summary: '被动语态中询问动作执行者用 von wem 或 durch wen。',
    example_sentence: 'Von wem wurde das Gemälde gemalt?',
    key_points: [
      'von + 人/机构（动作执行者）',
      'durch + 工具/手段',
      'wem 是 wer 的第三格',
    ],
  },
  // 关系从句卡片
  {
    id: 'relative_nominative_person',
    grammar_topic: '关系从句',
    grammar_subtopic: '人称关系代词',
    grammar_detail: '第一格阳性',
    rule_summary: '第一格阳性关系代词：der（人或物）。关系代词的性、数与先行词一致，格由从句中的语法功能决定。',
    example_sentence: 'Der Mann, der dort steht, ist mein Lehrer.',
    key_points: [
      '关系代词性、数与先行词一致',
      '第一格阳性关系代词为 der',
      '关系从句动词在句末',
    ],
  },
  {
    id: 'relative_accusative_person',
    grammar_topic: '关系从句',
    grammar_subtopic: '人称关系代词',
    grammar_detail: '第四格阴性',
    rule_summary: '第四格阴性关系代词：die。关系代词的格由其在从句中充当的成分决定。',
    example_sentence: 'Die Frau, die ich gestern gesehen habe, war nett.',
    key_points: [
      '阴性第四格关系代词同第一格：die',
      '从句中动词位置不变',
      '注意与英语 who/whom 的区别',
    ],
  },
  {
    id: 'relative_preposition_dat',
    grammar_topic: '关系从句',
    grammar_subtopic: '介词关系代词',
    grammar_detail: '第三格阳性',
    rule_summary: '介词后关系代词的格由介词决定。mit 支配第三格，阳性第三格关系代词为 dem。',
    example_sentence: 'Der Student, mit dem ich gesprochen habe, kommt aus China.',
    key_points: [
      '介词决定关系代词的格',
      'mit + 第三格',
      '关系代词紧接介词后',
    ],
  },
  {
    id: 'relative_preposition_dat_fem',
    grammar_topic: '关系从句',
    grammar_subtopic: '介词关系代词',
    grammar_detail: '第三格阴性',
    rule_summary: '阴性第三格关系代词：der。可用 welcher/welche/welches/welchen 替代，但不常用。',
    example_sentence: 'Die Stadt, in der ich wohne, ist sehr schön.',
    key_points: [
      '阴性第三格关系代词：der',
      '也可用 in welcher（更正式）',
      '介词 + 关系代词整体移动',
    ],
  },
  {
    id: 'relative_possessive_masc',
    grammar_topic: '关系从句',
    grammar_subtopic: '物主关系代词',
    grammar_detail: '第二格阳性',
    rule_summary: '物主关系代词：阳性/中性 dessen，阴性/复数 deren。表示所属关系。',
    example_sentence: 'Der Mann, dessen Bild ich bewundere, ist Künstler.',
    key_points: [
      'dessen = 他的/它的（第二格）',
      'deren = 她的/他们的（第二格）',
      '物主关系代词不变化',
    ],
  },
  {
    id: 'relative_possessive_neuter',
    grammar_topic: '关系从句',
    grammar_subtopic: '物主关系代词',
    grammar_detail: '第二格中性',
    rule_summary: '中性第二格物主关系代词：dessen。与阳性相同。',
    example_sentence: 'Das Haus, dessen Dach rot ist, gehört meinem Onkel.',
    key_points: [
      '中性第二格：dessen',
      '指代物的所属关系',
      '注意 dessen 不变化',
    ],
  },
  {
    id: 'relative_possessive_plural',
    grammar_topic: '关系从句',
    grammar_subtopic: '物主关系代词',
    grammar_detail: '第二格复数',
    rule_summary: '复数第二格物主关系代词：deren。表示复数名词的所属关系。',
    example_sentence: 'Die Kinder, deren Eltern berühmt sind, gehen hier zur Schule.',
    key_points: [
      '复数第二格：deren',
      'deren 对应 ihre（他们的）',
      '指人或物的所属均可',
    ],
  },
  {
    id: 'relative_accusative_plural',
    grammar_topic: '关系从句',
    grammar_subtopic: '人称关系代词',
    grammar_detail: '第四格复数',
    rule_summary: '复数第四格关系代词：die。与第一格同形。',
    example_sentence: 'Die Leute, die ich getroffen habe, waren sehr freundlich.',
    key_points: [
      '复数关系代词均为 die',
      '不区分格的变化',
      '由动词决定格',
    ],
  },
  {
    id: 'relative_wasis',
    grammar_topic: '关系从句',
    grammar_subtopic: 'was/was für',
    grammar_detail: 'was-关系从句',
    rule_summary: 'was 作为关系代词用于不定代词（alles, etwas, nichts, viel(es)）之后。',
    example_sentence: 'Alles, was er sagt, ist wichtig.',
    key_points: [
      'was 用于 alles, etwas, nichts, viel(es) 后',
      'was 也可用于最高级后',
      'was 不变化',
    ],
  },
  {
    id: 'relative_superlative',
    grammar_topic: '关系从句',
    grammar_subtopic: '特殊关系代词',
    grammar_detail: '最高级后关系代词',
    rule_summary: '最高级（der/die/das + -ste）后可用 das 或 welches 作关系代词。',
    example_sentence: 'Das ist das beste Buch, das ich je gelesen habe.',
    key_points: [
      '最高级后用 das 或 welches',
      '不用 der/die',
      'das 更常用',
    ],
  },
  {
    id: 'relative_dative_verb',
    grammar_topic: '关系从句',
    grammar_subtopic: '人称关系代词',
    grammar_detail: '第三格中性',
    rule_summary: '支配第三格的动词（helfen, danken, gefallen等）后，关系代词用第三格。',
    example_sentence: 'Das Mädchen, dem wir helfen, ist arm.',
    key_points: [
      'helfen, danken, gefallen 支配第三格',
      '中性第三格：dem',
      '动词决定关系代词的格',
    ],
  },
  {
    id: 'relative_preposition_pronoun',
    grammar_topic: '关系从句',
    grammar_subtopic: '介词关系代词',
    grammar_detail: '代词重复使用',
    rule_summary: '关系从句中，介词后的关系代词不能省略，且需与先行词保持性、数一致。',
    example_sentence: 'Das Auto, mit dem ich fahre, ist neu.',
    key_points: [
      '关系代词不可省略',
      '介词 + 关系代词整体',
      '避免重复使用名词',
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
