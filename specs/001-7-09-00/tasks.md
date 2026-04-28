---
description: 'Task list for EasySchedule multi-user time scheduling visualization system'
---

# Tasks: 多人时间协商可视化系统

**Input**: Design documents from `/specs/001-7-09-00/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/api.yml, research.md, quickstart.md

**Tests**: Tests are optional - only include if explicitly requested in feature specification

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume web app structure - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize TypeScript project with React 18 + Vite + Node.js + Express + Tailwind CSS dependencies
- [x] T003 [P] Configure linting and formatting tools (ESLint, Prettier)
- [x] T004 [P] Configure Git hooks and pre-commit checks

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**EasySchedule基础任务**:

- [x] T005 Setup database schema and migrations framework with Prisma
- [x] T006 [P] Implement timezone handling service (统一时区管理)
- [x] T007 [P] Setup API routing and middleware structure (Express + TypeScript)
- [x] T008 Create base models: Schedule, Participant, TimeSlot, ShareLink entities
- [x] T009 Configure error handling and logging infrastructure (winston)
- [x] T010 Setup environment configuration management (Windows Server compatible)
- [x] T011 [P] Configure Tailwind CSS design system and component library
- [x] T012 [P] Implement input validation and injection protection
- [x] T013 Setup data lifecycle management (expiration and cleanup with node-cron)
- [x] T014 Implement nanoid-based share link generation
- [x] T015 Setup shared TypeScript type definitions

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 创建时间协商表 (Priority: P1) 🎯 MVP

**Goal**: 创建者能够快速创建时间协商表并获得分享链接

**Independent Test**: 创建者能够独立完成表单创建并获得可分享的链接，无需依赖其他功能

### Implementation for User Story 1

- [x] T016 [P] [US1] Create Schedule model in backend/prisma/schema.prisma
- [x] T017 [P] [US1] Create ShareLink model in backend/prisma/schema.prisma
- [x] T018 [US1] Implement ScheduleService in backend/src/services/ScheduleService.ts
- [x] T019 [US1] Implement ShareLinkService in backend/src/services/ShareLinkService.ts
- [x] T020 [P] [US1] Create POST /api/schedules endpoint in backend/src/api/schedules.ts
- [x] T021 [P] [US1] Create GET /api/schedules/{scheduleId}/share endpoint in backend/src/api/schedules.ts
- [x] T022 [P] [US1] Create HomePage component in frontend/src/pages/HomePage.tsx
- [x] T023 [P] [US1] Create CreateScheduleForm component in frontend/src/components/CreateScheduleForm.tsx
- [x] T024 [US1] Implement schedule API service in frontend/src/services/scheduleApi.ts
- [x] T025 [US1] Setup React Router with basename="/EasySchedule" in frontend/src/App.tsx
- [x] T026 [US1] Add validation and error handling for schedule creation
- [x] T027 [US1] Add logging for schedule creation operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 参与者填写时间段 (Priority: P1)

**Goal**: 参与者通过分享链接访问并填写可用时间

**Independent Test**: 参与者能够独立完成时间填写，其数据能正确保存并在可视化界面中显示

### Implementation for User Story 2

- [x] T028 [P] [US2] Create Participant model in backend/prisma/schema.prisma
- [x] T029 [P] [US2] Create TimeSlot model in backend/prisma/schema.prisma
- [x] T030 [US2] Implement ParticipantService in backend/src/services/ParticipantService.ts
- [x] T031 [US2] Implement TimeSlotService in backend/src/services/TimeSlotService.ts
- [x] T032 [P] [US2] Create GET /api/share/{token} endpoint in backend/src/api/share.ts
- [x] T033 [P] [US2] Create POST /api/schedules/{scheduleId}/participants endpoint in backend/src/api/participants.ts
- [x] T034 [P] [US2] Create PUT /api/participants/{participantId}/timeslots endpoint in backend/src/api/participants.ts
- [x] T035 [P] [US2] Create ParticipantPage component in frontend/src/pages/ParticipantPage.tsx
- [x] T036 [P] [US2] Create TimeSlotSelector component in frontend/src/components/TimeSlotSelector.tsx
- [x] T037 [P] [US2] Create CalendarView component in frontend/src/components/CalendarView.tsx
- [x] T038 [US2] Implement participant API service in frontend/src/services/participantApi.ts
- [x] T039 [US2] Setup TanStack Query for data synchronization in frontend/src/hooks/useScheduleData.ts
- [x] T040 [US2] Add name uniqueness validation in frontend/src/utils/validation.ts
- [x] T041 [US2] Add quick time selection (上午/下午/晚上) in frontend/src/components/QuickTimeSelector.tsx
- [x] T042 [US2] Add custom time slot adjustment (30-minute granularity) in frontend/src/components/CustomTimeSlot.tsx
- [x] T042a [P] [US2] Create error notification system in frontend/src/components/ErrorNotifications.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 可视化查看协商结果 (Priority: P1)

**Goal**: 查看所有参与者的可用时间汇总图表和重叠统计

**Independent Test**: 可视化图表能正确显示所有参与者的时间信息，包括重叠区域的统计

### Implementation for User Story 3

- [x] T043 [P] [US3] Implement OverlapAnalysisService in backend/src/services/OverlapAnalysisService.ts
- [x] T044 [P] [US3] Create GET /api/schedules/{scheduleId}/analytics endpoint in backend/src/api/analytics.ts
- [x] T045 [P] [US3] Create AnalyticsService in frontend/src/services/analyticsApi.ts
- [x] T046 [P] [US3] Create VisualizationCalendar component in frontend/src/components/VisualizationCalendar.tsx
- [x] T047 [P] [US3] Create OverlapHeatmap component in frontend/src/components/OverlapHeatmap.tsx
- [x] T048 [P] [US3] Create TopOverlappingSlots component in frontend/src/components/TopOverlappingSlots.tsx
- [x] T049 [P] [US3] Create ParticipantList component in frontend/src/components/ParticipantList.tsx
- [x] T050 [US3] Implement color assignment and overlap visualization in frontend/src/utils/colorUtils.ts
- [x] T051 [US3] Add SVG-based calendar rendering with color overlay in frontend/src/components/SVGCalendar.tsx
- [x] T052 [US3] Optimize rendering performance for 30+ participants in frontend/src/hooks/useCalendarOptimization.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - 管理时间表生命周期 (Priority: P2)

**Goal**: 创建者能够锁定/解锁、销毁时间表，管理数据生命周期

**Independent Test**: 创建者能够锁定、解锁或销毁时间表，相应操作立即生效

### Implementation for User Story 4

- [x] T053 [P] [US4] Create POST /api/schedules/{scheduleId}/lock endpoint in backend/src/api/schedules.ts
- [x] T054 [P] [US4] Create DELETE /api/schedules/{scheduleId} endpoint in backend/src/api/schedules.ts
- [x] T055 [P] [US4] Implement auto-cleanup service with node-cron in backend/src/services/CleanupService.ts
- [x] T056 [P] [US4] Create OwnerView component in frontend/src/pages/OwnerView.tsx
- [x] T057 [P] [US4] Create ScheduleControls component in frontend/src/components/ScheduleControls.tsx
- [x] T058 [US4] Add expiration handling and warnings in frontend/src/components/ExpirationWarning.tsx
- [x] T059 [US4] Implement copy optimal time slots feature in frontend/src/utils/copyToClipboard.ts

---

## Phase 7: User Story 5 - 移动端和可访问性支持 (Priority: P2)

**Goal**: 确保应用在移动设备和不同用户群体中的可用性

**Independent Test**: 应用在移动设备浏览器中正常显示和操作，支持基础的无障碍访问

### Implementation for User Story 5

- [x] T060 [P] [US5] Implement responsive design with Tailwind CSS in frontend/src/styles/responsive.css
- [x] T061 [P] [US5] Add accessibility labels and ARIA support in frontend/src/components/AccessibleCalendar.tsx
- [x] T062 [P] [US5] Create mobile-optimized components in frontend/src/components/mobile/
- [SKIPPED] T063 [P] [US5] Add screen reader support and keyboard navigation in frontend/src/utils/accessibility.ts (无障碍功能不需要)
- [SKIPPED] T064 [P] [US5] Implement touch-friendly interactions in frontend/src/components/TouchCalendar.tsx (无障碍功能不需要)
- [SKIPPED] T065 [P] [US5] Add Chinese localization and date formatting in frontend/src/utils/localization.ts (无障碍功能不需要)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T066 [P] Documentation updates in docs/
- [ ] T067 Code cleanup and refactoring
- [ ] T068 Performance optimization across all stories
- [ ] T069 [P] Additional integration tests in backend/tests/integration/
- [ ] T070 Security hardening and input validation review
- [x] T071 [P] Error boundary implementation in frontend/src/components/ErrorBoundary.tsx
- [x] T072 Loading states and skeleton screens in frontend/src/components/LoadingStates.tsx
- [x] T073 [P] Deployment configuration and NGINX setup in nginx/
- [x] T074 Environment configuration and deployment scripts in scripts/
- [x] T075 Run quickstart.md validation and final testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 & US2 data
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Extends US1 functionality
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Cross-cutting improvements to all stories

### Within Each User Story

- Models before services
- Services before endpoints
- Frontend components after backend APIs
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Schedule model in backend/prisma/schema.prisma"
Task: "Create ShareLink model in backend/prisma/schema.prisma"

# Launch all services for User Story 1 together:
Task: "Implement ScheduleService in backend/src/services/ScheduleService.ts"
Task: "Implement ShareLinkService in backend/src/services/ShareLinkService.ts"

# Launch all frontend components for User Story 1 together:
Task: "Create HomePage component in frontend/src/pages/HomePage.tsx"
Task: "Create CreateScheduleForm component in frontend/src/components/CreateScheduleForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 2 (P1 features)
   - Developer B: User Story 3 + User Story 4 (P1 + P2 features)
   - Developer C: User Story 5 + Cross-cutting concerns
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests were requested)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Task Count Summary

- **Total Tasks**: 75
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 11 tasks
- **Phase 3 (US1 - Create Schedule)**: 12 tasks
- **Phase 4 (US2 - Participant Input)**: 15 tasks
- **Phase 5 (US3 - Visualization)**: 10 tasks
- **Phase 6 (US4 - Lifecycle Management)**: 7 tasks
- **Phase 7 (US5 - Mobile/Accessibility)**: 6 tasks
- **Phase 8 (Polish)**: 10 tasks

## MVP Scope Recommendation

**Minimum Viable Product**: Complete Phases 1-3 (Setup + Foundational + User Story 1)

- 27 tasks total
- Enables core functionality: create schedules and generate share links
- Provides foundation for adding remaining user stories incrementally

## Estimated Timeline (Single Developer)

- **Phase 1-2**: 3-4 days (Setup + Infrastructure)
- **Phase 3**: 2-3 days (User Story 1 - MVP)
- **Phase 4**: 3-4 days (User Story 2)
- **Phase 5**: 2-3 days (User Story 3)
- **Phase 6**: 2 days (User Story 4)
- **Phase 7**: 2 days (User Story 5)
- **Phase 8**: 2-3 days (Polish + Deployment)

**Total Estimated**: 16-22 days for complete implementation
**MVP Delivery**: 5-7 days for basic functionality
