# 굿즈 제작 원가·공급가 DB 시스템

굿즈 제작건의 **원가·공급가·제작 사양·첨부파일**을 제작건 단위로 정리하는 내부 관리 시스템.
생산 진행/일정/액션 관리는 포함하지 않는다(기존 업무관리 시트 담당).

## 기술 스택

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma (금액은 `Decimal`)
- TanStack Table (시트형 목록)
- React Hook Form 보조 + Zod 검증
- Tailwind CSS
- SheetJS(xlsx) — 다운로드(1차) / 업로드 매핑(2차)
- 로컬 디스크 파일 스토리지 (인터페이스 추상화 → S3/Supabase 교체 가능)

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. PostgreSQL 준비

Docker 사용 시:

```bash
docker compose up -d
```

또는 로컬 Postgres 를 직접 사용한다면 `.env` 의 `DATABASE_URL` 을 맞춘다.
기본값: `postgresql://goods:goods@localhost:5432/goods_cost?schema=public`

### 3. 환경변수

`.env.example` 를 참고 (이미 `.env` 기본값 포함).

### 4. DB 마이그레이션 & 시드

```bash
npm run db:migrate     # 최초 1회 마이그레이션 생성/적용
npm run db:seed        # (선택) 샘플 데이터
```

### 5. 개발 서버

```bash
npm run dev
# http://localhost:3000 → /records 로 이동
```

## 테스트

```bash
npm test               # 자동 계산 유틸 단위 테스트 (vitest)
```

## 디렉터리 구조

```
prisma/schema.prisma            # ProductionRecord, Attachment, ExcelMapping
src/lib/calc.ts                 # ★ 자동계산 단일 출처 (서버·클라 공용)
src/lib/records.ts              # 쿼리 빌더 + CRUD 서비스
src/lib/storage.ts              # 파일 스토리지 추상화 (로컬 구현)
src/lib/export.ts               # CSV/엑셀 컬럼 정의
src/app/records/                # 목록 / 등록 / 상세 / 수정 화면
src/app/api/records/            # CRUD + export API
src/app/api/attachments/        # 첨부 업로드/삭제 API
src/app/api/files/[...key]/     # 로컬 파일 서빙
```

## 자동 계산식 (lib/calc.ts 에 고정)

```
factoryTotalPrice = quantity × factoryUnitPrice
finalCost         = factoryTotalPrice + sampleFee + extraCost
supplyTotalPrice  = quantity × supplyUnitPrice
marginAmount      = supplyTotalPrice − finalCost
marginRate        = marginAmount ÷ supplyTotalPrice × 100   (공급총액 0 → null)
```

- 빈 값은 0 으로 처리. 금액 소수 4자리, 마진율 소수 2자리 반올림.
- 저장 시 서버에서 항상 재계산 → DB 값과 화면 값 불일치 방지.

## 2차 기능(엑셀 자동 입력) 확장 지점

`ExcelMapping` 테이블(공장별 컬럼 매핑)과 `DocumentType` enum 이 이미 스키마에 포함되어 있다.
2차에서는 업로드 → 시트/컬럼 표시 → 매핑 → 미리보기 → 검수 후 저장 흐름을 추가한다.
자동 저장은 하지 않으며 반드시 사용자가 검수 후 저장한다.

## 알려진 사항

- `xlsx`(SheetJS) npm 배포본에 알려진 취약점 경고가 있음. 신뢰된 내부 파일만 처리하며,
  필요 시 공식 CDN 빌드(`https://cdn.sheetjs.com`)로 교체 권장.
- 인증/권한은 1차 MVP 범위에서 제외(사내망 가정).
```
