# 프로젝트 케이스 스터디

박성은의 프로젝트 11건을 **문제 → 나의 활동 → 성과 → 의사결정 → 회고** 순으로 정리한 문서입니다.
화면이 아니라 **무엇을 고민했고 무엇을 기각했는지**가 읽히도록 썼습니다.

전체 포트폴리오 → **https://sungeun-portfolio.vercel.app**

---

## 핵심 프로젝트

| | 프로젝트 | 축 | 한 줄 |
|---|---|---|---|
| 01 | **[DERO](docs/dero.md)** | Infra · Frontend | 제품을 고르는 화면과 내 책상에 놓아보는 화면을 하나로 합친 서비스. EC2 한 대에서 무중단 배포까지… |
| 02 | **[AWS 식당 예약 서비스](docs/aws.md)** | Infra | 배포로 끝내지 않고 장애 추적·확장성·비용까지 관리 가능한 구조로. “안정성을 얼마나 살 것인가”를 기술… |
| 03 | **[Bimp](docs/vimp.md)** | Data · AI | 직접 입력의 불편을 이미지 인식으로 줄인 졸업 프로젝트. 문제를 ‘추천’이 아니라 ‘등록’으로 재정의한… |
| 04 | **[Lumière](docs/lumiere.md)** | Infra · AI | 진단은 받아도 “그래서 뭘 사야 하나”로 이어지지 않습니다. 진단과 추천 사이의 빈 칸을 메운 서비스입니… |
| 05 | **[DERO 비즈니스 모델](docs/dero-bm.md)** | PM · 기획 | 만든 시뮬레이터를 어떻게 돈이 되게 할 것인가를 따로 설계했습니다. 서비스 개발과 분리해 기획과 BM만… |

## 보조 프로젝트

| | 프로젝트 | 축 | 한 줄 |
|---|---|---|---|
| 06 | **[실시간 노션 퀴즈 쇼](docs/quiz.md)** | Product | 말로 하던 출제 · 응답 · 채점 · 집계를 실시간 웹 도구로 옮겼습니다. 회차당 준비시간 3~4시간 →… |
| 07 | **[인천 카페 창업 상권 분석](docs/cafe.md)** | Data | 예측 정확도가 아니라 “왜 이 입지인가”에 답하는 분석. 창업자는 점수가 아니라 근거를 필요로 합니다. |
| 08 | **[멍경찰과 냥도둑](docs/pawlice.md)** | Frontend · Game | 역할마다 목표와 수단이 다르면서도 서로에게 영향을 주게 만드는 것이 과제였습니다. 기여도 100%. |
| 09 | **[ChADa](docs/chada.md)** | Study | 읽은 것을 돌려보기 전에는 안다고 하지 않는 습관이 여기서 생겼습니다. |
| 10 | **[영화 추천 시스템](docs/movierec.md)** | Data · AI | 두 모델을 만들어 학습 성능이 아니라 일반화 성능으로 골랐습니다. |
| 11 | **[SnapHere](docs/snaphere.md)** | Product | 관광 공공데이터를 활용한 서비스. 지금 만들고 있습니다. |

---

## 읽는 순서

지원 직무에 따라 먼저 볼 문서가 다릅니다.

| 직무 | 순서 | 사이트 |
|---|---|---|
| Frontend · UI/UX | [DERO](docs/dero.md) → [Lumière](docs/lumiere.md) → [멍경찰과 냥도둑](docs/pawlice.md) | [?role=fe](https://sungeun-portfolio.vercel.app/?role=fe) |
| Infra | [AWS](docs/aws.md) → [DERO](docs/dero.md) → [Bimp](docs/vimp.md) | [?role=infra](https://sungeun-portfolio.vercel.app/?role=infra) |
| Data · AI | [Bimp](docs/vimp.md) → [인천 카페](docs/cafe.md) → [AWS](docs/aws.md) | [?role=data](https://sungeun-portfolio.vercel.app/?role=data) |
| Product Engineer | [DERO](docs/dero.md) → [Bimp](docs/vimp.md) → [Lumière](docs/lumiere.md) | [?role=product](https://sungeun-portfolio.vercel.app/?role=product) |
| PM · 기획 | [DERO](docs/dero.md) → [Lumière](docs/lumiere.md) → [DERO 비즈니스 모델](docs/dero-bm.md) | [?role=pm](https://sungeun-portfolio.vercel.app/?role=pm) |

---

## 이 문서들에 대해

- 사이트와 **같은 원본**에서 생성했습니다 — `projects/*.html` 에서 뽑아 씁니다. 내용이 갈라지지 않습니다.
- 각 문서는 **기각한 선택과 그 사유**를 포함합니다 — 고른 것만 적으면 판단이 보이지 않기 때문입니다.
- 수치는 발표자료 · 보고서 · 설문 원본에서 확인한 것만 적었습니다. 확인되지 않은 값은 비워 두었습니다.
- 사이트의 구성도 중 코드로 그린 것은 마크다운에 옮길 수 없어, **글로 쓴 설명과 캡션**으로 대신했습니다.
- DERO 소스는 SSAFY GitLab에 있어 외부 열람이 제한됩니다.

제출용 PDF 는 **[docs/pdf/](docs/pdf/)** 에 있습니다.

연락 · pppp000310@gmail.com

---

사이트 자체의 구조와 배포 방법은 **[SITE.md](SITE.md)** 에 있습니다.
