// Source positions point to original candidates, not copied definitions or creator replies.
const positions = ids => Object.freeze(ids.split(' ').map((pairId, index) => Object.freeze({ position: index + 1, pairId })));
export const SOURCE_COVERAGE = Object.freeze([
  Object.freeze({ reference: "atlassian",
    scope: "All 31 named terms, in article order. Stock terms may appear inside a short editorial setup.",
    items: positions("c181 c311 c103 c101 c182 c183 c184 c122 c185 c141 c186 c187 c188 c189 c190 c191 c106 c102 c192 c193 c194 c117 c195 c111 c196 c197 c312 c198 c199 c200 c201") }),
  Object.freeze({ reference: "techtarget",
    scope: "All 58 named terms, in article order. Definitions and example sentences are not copied.",
    items: positions("c202 c203 c204 c103 c205 c206 c207 c208 c209 c210 c211 c105 c183 c212 c213 c214 c215 c216 c217 c218 c219 c187 c220 c221 c222 c101 c102 c107 c223 c224 c225 c106 c226 c227 c228 c126 c194 c117 c195 c111 c229 c230 c231 c232 c233 c234 c235 c109 c236 c237 c104 c238 c239 c240 c241 c201 c242 c243") }),
  Object.freeze({ reference: "linkedin-khurana",
    scope: "All six carousel ideas, in slide order after the title. Stock phrasing and original adaptations; sincere questions are not evidence of insults.",
    items: positions("c162 c306 c307 c308 c309 c310") }),
  Object.freeze({ reference: "whaley-roundup",
    scope: "All 30 numbered image positions, by intent. Positions 20 and 21 repeat the same source item; both point to one candidate.",
    items: positions("p181 p182 p183 p184 p185 p186 p187 p188 p189 p190 p191 p192 p193 p194 p195 p196 p197 p198 p199 p200 p200 p201 p202 p203 p204 p205 p206 p207 p208 p209") }),
  Object.freeze({ reference: "boredpanda-whaley",
    scope: "All 39 displayed image positions, by intent: 30 featured and nine community additions. Professional replies are original adaptations.",
    items: positions("p181 p182 p183 p184 p185 p186 p187 p188 p189 p190 p191 p192 p193 p194 p195 p210 p196 p197 p198 p199 p200 p201 p202 p203 p204 p205 p206 p207 p208 p209 p211 p212 p213 p214 p215 p216 p217 p218 p219") }),
  Object.freeze({ reference: "reddit-askuk",
    scope: "Distinct workplace terms and relevant variants in publicly loaded comments checked on 21 October 2026. Repeats share candidates. Deleted, collapsed, future and off-topic replies are excluded.",
    items: positions("c244 c245 c104 c246 c101 c247 c313 c248 c249 c201 c250 c251 c252 c142 c141 c253 c254 c314 c102 c255 c256 c257 c258 c259 c122 c260 c261 c194 c262 c263 c264 c265 c266 c267 c268 c269 c270 c136 c271 c272 c117 c273 c274 c231 c275 c276 c277 c105 c278 c279 c280 c315 c281 c127 c234 c282 c283 c284 c285 c103 c286 c227 c287 c288 c149 c289 c290 c316 c189 c291 c292 c293 c294 c295 c296 c297 c298 c299 c300 c301 c302 c303 c304 c305") }),
]);
