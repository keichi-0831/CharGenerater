// ============================================================
//  基础常量 / 共享状态
// ============================================================
const SIMPLE_IDS = [
    'char_name','chinese_name','nickname','age','birthday_date','birthday_zodiac',
    'gender','height','replace_alias',
    'hair','eyes','skin','face_style',
    'attire_formal','attire_business','attire_casual','attire_home',
    'emotional_angry','emotional_happy','emotional_sad',
    'speech_with_user','speech_reasoning','speech_accent','speech_online',
    'additional_notes',
    'age_range_childhood','age_range_teenage','age_range_youth','age_range_current',
    'nsfw_experiences','nsfw_orientation',

    // 世界书：单字段类（内容本体）
    'world_statusbar','world_era_background','world_special_settings',
    'world_frontend_decor','world_persona_correction','world_state_specified','world_extra',

    // 世界书：每条条目的导出配置（名称 / 触发方式 / 关键字 / 位置 / 深度 / 顺序）
    'world_statusbar_comment','world_statusbar_constant','world_statusbar_key','world_statusbar_position','world_statusbar_depth','world_statusbar_order',
    'world_era_background_comment','world_era_background_constant','world_era_background_key','world_era_background_position','world_era_background_depth','world_era_background_order',
    'world_special_settings_comment','world_special_settings_constant','world_special_settings_key','world_special_settings_position','world_special_settings_depth','world_special_settings_order',
    'world_npcs_comment','world_npcs_constant','world_npcs_key','world_npcs_position','world_npcs_depth','world_npcs_order',
    'world_frontend_decor_comment','world_frontend_decor_constant','world_frontend_decor_key','world_frontend_decor_position','world_frontend_decor_depth','world_frontend_decor_order',
    'world_persona_correction_comment','world_persona_correction_constant','world_persona_correction_key','world_persona_correction_position','world_persona_correction_depth','world_persona_correction_order',
    'world_state_specified_comment','world_state_specified_constant','world_state_specified_key','world_state_specified_position','world_state_specified_depth','world_state_specified_order',
    'world_extra_comment','world_extra_constant','world_extra_key','world_extra_position','world_extra_depth','world_extra_order'
];

const ARRAY_DEFS = [
    ['identity-container',        'identity-item',        false],
    ['archetype-container',       'archetype-item',       false],
    ['social-container',          'social-item',          false],
    ['childhood-container',       'childhood-item',       true],
    ['teenage-container',         'teenage-item',         true],
    ['youth-container',           'youth-item',           true],
    ['current-container',         'current-item',         true],
    ['build-container',           'build-item',           false],
    ['core-traits-container',     'core-traits-item',     false],
    ['romantic-traits-container', 'romantic-traits-item', false],
    ['weakness-container',        'weakness-item',        false],
    ['likes-container',           'likes-item',           false],
    ['dislikes-container',        'dislikes-item',        false],
    ['goals-container',           'goals-item',           false],
    ['past_events-container',     'past_events-item',     true],
    ['impression-container',      'impression-item',      true],
    ['relation_notes-container',  'relation_notes-item',  true],
    ['lifestyle-container',       'lifestyle-item',       true],
    ['work-container',            'work-item',            true],
    ['boundaries-container',      'boundaries-item',      true],
    ['work-skills-container',     'work-skills-item',     false],
    ['life-skills-container',     'life-skills-item',     false],
    ['hobby-skills-container',    'hobby-skills-item',    false],
    ['catchphrase-container',     'catchphrase-item',     false],
    ['mannerisms-container',      'mannerisms-item',      false],
    ['trauma-container',          'trauma-item',          true],
    ['values-container',          'values-item',          false],
    ['conflicts-container',       'conflicts-item',       true],
    ['secrets-container',         'secrets-item',         true],
    ['relationships-container',   'relationships-item',   true],
    ['defining-moments-container','defining-moments-item',true],
    ['nsfw-role-container',       'nsfw-role-item',       true],
    ['nsfw-habits-container',     'nsfw-habits-item',     true],
    ['kinks-container',           'kinks-item',           false],
    ['limits-container',          'limits-item',          false],

    // 世界书：数组类
    ['world_npc-container',       'world_npc-item',       true],
];

const LS_CHARS = 'rp_characters';
const LS_CURRENT = 'rp_current_char';
const LS_INSPO = 'rp_inspo_pool';
const LS_INSPO_LAST_ROLL = 'rp_inspo_last_roll';
const LS_SYNC_USER = 'sync_user_id';
const LS_SYNC_USERS = 'sync_user_ids';
const LS_SYNC_USER_CURRENT = 'sync_user_id_current';
const LS_VISITOR_ID = 'unique_visitor_id';
const LS_SURNAMES = 'rp_namer_surnames';
const LS_CHARNAMES = 'rp_namer_charnames';
const LS_AI_PROVIDERS = 'rp_ai_providers';
const LS_AI_CURRENT_P = 'rp_ai_current_provider';
const LS_AI_CONFIG = 'rp_ai_config';
const LS_AI_UI_STATE = 'rp_ai_ui_state';
const CLOUD_META_CONFIG_ID = '__cloud_meta_config__';

const SUPABASE_URL = 'https://cukfyqnrsrikimipbyrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2Z5cW5yc3Jpa2ltaXBieXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjY2MTEsImV4cCI6MjA4ODIwMjYxMX0.Dj7zH_OGJZ5X2jJolRXx4nTnOKN4_rUnRvboUm0-OoU';

const DEFAULT_SURNAMES = ['李','王','张','刘','陈','杨','赵','黄','周','吴','徐','孙','朱','马','胡','郭','林','何','高','梁','郑','谢','宋','唐','许','韩','冯','邓','曹','彭','曾','萧','田','董','袁','潘','于','蒋','蔡','余','杜','叶','程','苏','魏','吕','丁','任','沈','姚','卢','姜','崔','钟','谭','陆','汪','范','白','廖','秦','金','江','史','顾','侯','邵','孟','龙','万','段','漕','钱','汤','尹','黎','易','常','武','乔','贺','赖','龚','文'];
const DEFAULT_CHARNAMES = ['若','安','清','云','月','雪','烟','霜','风','竹','梅','兰','菊','莲','瑾','璃','玉','珏','珊','瑶','璇','琛','琰','瑜','熙','辰','宸','晨','曦','昊','昕','旭','晓','明','远','深','浩','澜','渊','泽','涵','沁','滟','溪','洛','汐','泠','漪','鸢','翎','鸿','羽','凌','烨','炎','焰','煜','灼','焱','霆','霖','霓','灵','皓','皎','皙','奕','弈','亦','亦','逸','渺','邈','悠','沉','衡','衍','庭','廷','琦','琰','钰','锦','绯','绮','缦','纱','纨','绢','素','织','绫','罗','缎','纶','弦','韵','音','律','谐','和','静','幽','谧','澄','淡','淑','惠','雅','致','萱','蘅','芷','芸','茉','莺','蓉','菱','荷','芙','蔷','薇','苓','苒','苏','蓓','蕊','蕾','馨','芳','蔚','葳','葵','蒲','菡','荣','华','秀','英','颖','卿','莞','婉','婧','嫣','嫦','媛','姝','姣','婵','娴','娉','婷'];

const MODULE_LABELS = {
    // 人设卡模块
    basic: '基础信息',
    background: '背景故事',
    appearance: '外貌穿着',
    personality: '性格特质',
    user_relation: '{{user}}相关',
    behavior: '行为习惯',
    speech: '说话风格',
    extra: '额外补充',
    nsfw: '🔞 NSFW信息',

    // 世界书模块（用于 AI 世界观子标签 + 结果徽章展示）
    world_statusbar: '状态栏',
    world_era_background: '时代背景',
    world_special_settings: '特殊设定',
    world_npcs: 'NPCs',
    world_frontend_decor: '前端美化',
    world_persona_correction: '人设纠偏',
    world_state_specified: '指定状态',
    world_extra: '额外补充',

    // user 人设模块
    basic_user: '基础信息_user',
    personality_user: '性格特质_user',
    relation_user: '关系定位_user',
    preference_user: '喜好与边界_user',
    NSFW_user: 'NSFW_user'
};

const MODULE_JSON_SCHEMA = {
    basic: `  "basic": { "char_name":"", "chinese_name":"", "nickname":"", "age":"", "birthday_date":"", "birthday_zodiac":"", "gender":"", "height":"", "identity":[], "archetype":[], "social":[] }`,
    background: `  "background": { "childhood_range":"0-12岁", "childhood":[], "teenage_range":"13-18岁", "teenage":[], "youth_range":"19-24岁", "youth":[], "current_range":"", "current":[] }`,
    appearance: `  "appearance": { "hair":"", "eyes":"", "skin":"", "face_style":"", "build":[], "attire_formal":"", "attire_business":"", "attire_casual":"", "attire_home":"" }`,
    personality: `  "personality": { "core_traits":[], "romantic_traits":[], "weakness":[], "likes":[], "dislikes":[], "goals":[] }`,
    user_relation: `  "user_relation": { "past_events":[], "impression":[], "notes":[] }`,
    behavior: `  "behavior": { "lifestyle":[], "work_behaviors":[], "emotional_angry":"", "emotional_happy":"", "emotional_sad":"", "boundaries":[], "work_skills":[], "life_skills":[], "hobby_skills":[] }`,
    speech: `  "speech": { "speech_with_user":"", "speech_reasoning":"", "speech_accent":"", "speech_online":"" }`,
    extra: `  "extra": { "additional_notes":"", "catchphrases":[], "mannerisms":[], "trauma":[], "values":[], "conflicts":[], "secrets":[], "relationships":[], "defining_moments":[] }`,
    nsfw: `  "nsfw": { "experiences":"", "sexual_orientation":"", "sexual_role":[], "sexual_habits":[], "kinks":[], "limits":[] }`,

    // worldbook: 预留世界书导出结构（供 AI 子标签 / 将来 YAML 导出使用）
    // 注意：这里不再是一个整体的 worldbook 大对象，而是世界书各子模块的 schema 片段，方便按勾选模块动态组合
    world_statusbar: `  "statusbar": ""`,
    world_era_background: `  "era_background": ""`,
    world_special_settings: `  "special_settings": ""`,
    world_npcs: `  "npcs": []`,
    world_frontend_decor: `  "frontend_decor": ""`,
    world_persona_correction: `  "persona_correction": ""`,
    world_state_specified: `  "state_specified": ""`,
    world_extra: `  "extra": ""`,

    // user persona: 这里保留标签名映射，实际提示词走 YAML 标签而非 JSON schema
    basic_user: `<basic_user>\n  summary: \"\"\n  identity: []\n  first_impression: \"\"\n</basic_user>`,
    personality_user: `<personality_user>\n  core_traits: []\n  strengths: []\n  flaws: []\n  emotional_patterns: []\n</personality_user>`,
    relation_user: `<relation_user>\n  relation_to_char: \"\"\n  view_on_char: \"\"\n  needs_in_relationship: []\n  sensitive_points: []\n</relation_user>`,
    preference_user: `<preference_user>\n  likes: []\n  dislikes: []\n  boundaries: []\n</preference_user>`,
    NSFW_user: `<NSFW_user>\n  acceptance: \"\"\n  preferences: []\n  limits: []\n</NSFW_user>`
};

// 世界书导出到 SillyTavern JSON 时使用的默认字段（除去用户可配置项）
// 用户可在界面上配置的字段只有：
// comment, content, constant, key, position, depth, order
// 其他字段全部按照这里的默认值写死
const WORLDBOOK_JSON_DEFAULTS = {
    keysecondary: [],
    vectorized: false,
    selective: true,
    selectiveLogic: 0,
    addMemo: true,
    disable: false,
    excludeRecursion: false,
    preventRecursion: false,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    delayUntilRecursion: false,
    probability: 100,
    useProbability: true,
    group: "",
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    useGroupScoring: null,
    automationId: "",
    role: 0,
    sticky: 0,
    cooldown: 0,
    delay: 0
};

const AI_SUBTAB_PERSONA_CARD = 'persona-card';
const AI_SUBTAB_WORLDVIEW = 'worldview';
const AI_SUBTAB_USER_PERSONA = 'user-persona';
const AI_SUBTAB_OPENING = 'opening';
const AI_SUBTAB_FRONTEND_DECOR = 'frontend-decor';
const AI_CACHE_TABS = [AI_SUBTAB_PERSONA_CARD, AI_SUBTAB_WORLDVIEW, AI_SUBTAB_USER_PERSONA, AI_SUBTAB_OPENING, AI_SUBTAB_FRONTEND_DECOR];

const AI_PRONOUN_LABELS = {
    first: '第一人称',
    second: '第二人称',
    third: '第三人称'
};

const AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT = `请根据用户提供的需求与各模块引导词，补全对应的人设卡内容。
要求：
1. 只生成本次请求的模块；
2. 若表单里已有内容，请优先参考并保持设定一致；
3. 列表字段尽量提供 2-5 个条目，描述精炼但有层次；
4. 设定之间要前后呼应，避免互相冲突；
5. 风格保持细腻、自然、适合角色卡直接使用。`;

const AI_WORLDVIEW_INSTRUCTIONS_DEFAULT = `请根据用户提供的需求与当前角色设定，帮助补全与本角色相关的世界观与剧情语境。
需要重点围绕以下方面展开：
1. 从<requested_modules>中的维度组织内容，使之可以直接填入【世界书】对应字段；
2. 所有设定要与角色卡中的背景故事、性格特质、关系现状等保持一致，避免产生前后矛盾；
3. 描述力求具体、可落地，便于后续作为世界书条目被模型引用，而不是抽象空泛的世界观介绍；
4. 如无特别说明，请避免写成完整剧情，而是聚焦于设定本身及其对角色与长线剧情走向的影响。`;

const AI_USER_PERSONA_INSTRUCTIONS_DEFAULT = `请根据用户提供的 <about_me>、XP_core、char 当前设定与已勾选模块，为用户生成一份“简单的 user 人设”。
要求：
1. 回复必须使用 YAML 风格内容，并按要求放在对应的 XML 标签中（如 <basic_user>...</basic_user>）；
2. 只输出本次请求的 user 模块，不要额外补充未勾选部分；
3. user 人设应服务于 char 与 user 的互动，不要写得比 char 更庞杂；
4. 内容要简洁、实用、便于后续直接参考；
5. 若涉及 NSFW_user，请保持成人向虚构语境，重点写偏好与边界。`;

const AI_OPENING_INSTRUCTIONS_DEFAULT = `请直接输出一段可用于故事开篇的正文，不要使用JSON、标题、分点、注释或markdown格式。
需要满足以下要求：
1. 紧扣用户提供的角色设定、关系线索、氛围关键词与故事开端描述；
2. 重点呈现角色登场、场景氛围、冲突伏笔或情绪张力；
3. 语言有画面感与文学性，但保持可读性；
4. 正文长度尽量贴近用户要求的字数范围；
5. 只回复开场白正文本身，不要附加解释。`;

const AI_STATUS_INSTRUCTIONS_DEFAULT = `请根据 <status_style>、角色卡与世界书内容，设计一套“适合 char 人设卡使用”的状态栏方案。你的回复必须严格分为以下两段标签内容，除此之外不要输出任何解释、markdown 标题或代码块：

<status_prompt>
这里写“给角色模型使用的状态栏生成提示词”正文。
要求：
1. 这段提示词要指导模型在每次回复末尾追加一个 <status>...</status> 状态栏；
2. 状态栏风格必须贴合 char 人设卡气质，像角色信息侧写/情境状态卡，而不是冰冷的系统日志；
3. 状态栏内容至少应覆盖：时间、地点、天气、char 当前状态；并鼓励结合设定补充穿着、姿态、表层情绪、隐秘心绪、与 {{user}} 的关系温度、特殊世界观字段等；
4. 字段之间统一使用半角竖线 | 分隔；
5. 提示词里要明确要求模型保持字段顺序稳定、措辞简洁、有画面感，并给出 1 个完整示例；
6. 这段内容应是可直接复制使用的纯文本提示词。
</status_prompt>

<status_regex>
这里必须只放一个 JSON 对象，用于导出前端正则配置，格式尽量参考现有“状态栏”正则文件：
{
  "scriptName": "状态栏",
  "findRegex": "<status>(...)<\\/status>",
  "replaceString": "...HTML with inline CSS...",
  "trimStrings": [],
  "placement": [2],
  "disabled": false,
  "markdownOnly": true,
  "promptOnly": false,
  "runOnEdit": true,
  "substituteRegex": 0,
  "minDepth": null,
  "maxDepth": null
}
要求：
1. findRegex 必须能准确捕获 <status> 标签中的各字段，并与 replaceString 中的 $1、$2、$3... 一一对应；
2. replaceString 必须是成套可预览的 HTML + 内联 CSS，整体风格服务于 char 人设卡氛围；
3. 最外层使用 <details> + <summary> 实现折叠；
4. 布局请参考状态栏/信息卡类前端美化写法，字段层级清晰，可直接用于 HTML 预览；
5. JSON 内不要省略关键字段，字符串中的引号、换行和反斜杠都要正确转义，保证 JSON 可被直接解析；
6. scriptName 默认写“状态栏”。
</status_regex>`;

window.AppState = window.AppState || {
    supabaseClient: null,
    syncUserId: '',
    configSyncTimer: null,
    isApplyingCloudConfig: false,
    hasPendingCloudChanges: false,
    saveTimer: null,
    aiLastJson: null,
    aiLastModules: [],
    aiActiveSubtab: AI_SUBTAB_PERSONA_CARD,
    // 记录每个 AI 子标签最近一次请求时使用的 system / user 消息，供“继续生成”功能复用
    aiLastSystemMsgs: {},
    aiLastUserMsgs: {},
    aiInstructionDrafts: {
        [AI_SUBTAB_PERSONA_CARD]: AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_WORLDVIEW]: AI_WORLDVIEW_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_USER_PERSONA]: AI_USER_PERSONA_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_OPENING]: AI_OPENING_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_FRONTEND_DECOR]: AI_STATUS_INSTRUCTIONS_DEFAULT
    },
    selectedModel: '',
    currentAbortController: null,
    namerImportType: 'surname'
};