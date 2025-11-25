# Proposta: Fichas de Treino (Workout Routines)

## Visão Geral

Adicionar suporte a **fichas de treino** no módulo Training, permitindo agrupar exercícios em rotinas reutilizáveis para logar múltiplos exercícios de uma vez.

---

## Novos Tipos

```typescript
// types/training.ts

export type WorkoutRoutine = {
  id: string;
  name: string;
  exerciseIds: string[]; // Lista ordenada de exercícios
  createdAt: string;
};

export type WorkoutRoutineWithExercises = WorkoutRoutine & {
  exercises: Exercise[];
};
```

---

## Estrutura de Arquivos

```
app/training/
├── index.tsx           # Tela principal (atualizada)
├── [id].tsx            # Detalhe do exercício (existente)
├── exercises.tsx       # Lista de exercícios (existente)
├── routines.tsx        # [NOVO] Lista de fichas de treino
└── routine/
    └── [id].tsx        # [NOVO] Detalhe/edição da ficha
```

---

## Layout das Telas

### 1. Tela Principal (`index.tsx`) - Atualizada

#### Modal de Log Session - Com Seletor de Tipo

```
┌─────────────────────────────────────┐
│  Registrar Treino              [X]  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────┬───────────────┐  │
│  │   Exercício   │     Ficha     │  │  ← Type Selector (igual investments)
│  │   [icon]      │    [icon]     │  │
│  └───────────────┴───────────────┘  │
│                                     │
│  [Conteúdo dinâmico baseado no tipo]│
│                                     │
└─────────────────────────────────────┘
```

#### Se "Exercício" selecionado (comportamento atual):

```
┌─────────────────────────────────────┐
│  Selecionar exercício               │
│  ┌─────────────────────────────────┐│
│  │ 🔍 Buscar exercício...          ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ Supino Reto          12 treinos ││
│  │ Agachamento           8 treinos ││
│  │ ...                             ││
│  └─────────────────────────────────┘│
│                                     │
│  Séries                             │
│  ┌─┐ ┌──────┐   ┌──────┐           │
│  │1│ │ 80kg │ × │ 10   │ rep  [-]  │
│  └─┘ └──────┘   └──────┘           │
│  ┌─┐ ┌──────┐   ┌──────┐           │
│  │2│ │ 80kg │ × │ 8    │ rep  [-]  │
│  └─┘ └──────┘   └──────┘           │
│  ┌──────────────────────────────┐  │
│  │     + Adicionar série        │  │
│  └──────────────────────────────┘  │
│                                     │
│  Data: [📅 24/11/2024]              │
│  Notas: [___________________]       │
│                                     │
│  ┌─────────────────────────────────┐│
│  │       Adicionar Treino          ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

#### Se "Ficha" selecionado:

```
┌─────────────────────────────────────┐
│  Selecionar ficha                   │
│  ┌─────────────────────────────────┐│
│  │ Treino A - Peito/Tríceps        ││
│  │ Treino B - Costas/Bíceps        ││
│  │ Treino C - Pernas               ││
│  └─────────────────────────────────┘│
│                                     │
│  ──────────────────────────────────│
│                                     │
│  Exercícios da ficha:               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Supino Reto                 [-] ││  ← Pode remover
│  │ ┌─┐ ┌────┐ × ┌────┐            ││
│  │ │1│ │80kg│   │ 10 │ rep   [-]  ││
│  │ └─┘ └────┘   └────┘            ││
│  │ ┌─┐ ┌────┐ × ┌────┐            ││
│  │ │2│ │80kg│   │ 8  │ rep   [-]  ││
│  │ └─┘ └────┘   └────┘            ││
│  │      [+ Adicionar série]        ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Supino Inclinado            [-] ││
│  │ ┌─┐ ┌────┐ × ┌────┐            ││
│  │ │1│ │60kg│   │ 12 │ rep   [-]  ││
│  │ └─┘ └────┘   └────┘            ││
│  │      [+ Adicionar série]        ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │   + Adicionar exercício         ││  ← Adicionar exercício extra
│  └─────────────────────────────────┘│
│                                     │
│  Data: [📅 24/11/2024]              │
│  Notas: [___________________]       │
│                                     │
│  ┌─────────────────────────────────┐│
│  │    Registrar Ficha Completa     ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

### 2. Nova Tela: Lista de Fichas (`routines.tsx`)

```
┌─────────────────────────────────────┐
│  ←  Fichas de Treino                │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🗂️  Treino A - Peito/Tríceps    ││
│  │     4 exercícios                ││
│  │                            [>]  ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🗂️  Treino B - Costas/Bíceps    ││
│  │     5 exercícios                ││
│  │                            [>]  ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🗂️  Treino C - Pernas           ││
│  │     6 exercícios                ││
│  │                            [>]  ││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │  ➕  Nova Ficha de Treino       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

### 3. Nova Tela: Detalhe da Ficha (`routine/[id].tsx`)

```
┌─────────────────────────────────────┐
│  ←  Treino A - Peito/Tríceps  [✏️]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 📊  4 exercícios                ││
│  │ 🔥  12 vezes usado              ││
│  └─────────────────────────────────┘│
│                                     │
│  Exercícios                         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ≡  1. Supino Reto               ││  ← Drag handle para reordenar
│  │     Volume total: 15.200kg      ││
│  │                      [✏️] [🗑️] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ≡  2. Supino Inclinado          ││
│  │     Volume total: 8.400kg       ││
│  │                      [✏️] [🗑️] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ≡  3. Crucifixo                 ││
│  │     Volume total: 4.200kg       ││
│  │                      [✏️] [🗑️] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ≡  4. Tríceps Corda             ││
│  │     Volume total: 6.800kg       ││
│  │                      [✏️] [🗑️] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │    + Adicionar Exercício        ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │    🗑️  Excluir Ficha            ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

### 4. Tela Principal - Novo Botão

Adicionar botão "Ver Fichas" na tela principal, similar ao "Ver Todos Exercícios":

```
┌─────────────────────────────────────┐
│  [📋] Ver Todas as Fichas      [>]  │
└─────────────────────────────────────┘
```

---

## Modal: Nova Ficha de Treino

```
┌─────────────────────────────────────┐
│  Nova Ficha de Treino          [X]  │
├─────────────────────────────────────┤
│                                     │
│  Nome da ficha                      │
│  ┌─────────────────────────────────┐│
│  │ Treino A - Peito/Tríceps        ││
│  └─────────────────────────────────┘│
│                                     │
│  Exercícios                         │
│  ┌─────────────────────────────────┐│
│  │ [✓] Supino Reto                 ││
│  │ [✓] Supino Inclinado            ││
│  │ [ ] Agachamento                 ││
│  │ [✓] Crucifixo                   ││
│  │ [ ] Leg Press                   ││
│  │ [✓] Tríceps Corda               ││
│  │ ...                             ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │          Criar Ficha            ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Fluxo de Uso

### Criar Ficha:
1. Ir em "Ver Todas as Fichas"
2. Clicar em "Nova Ficha"
3. Dar nome e selecionar exercícios
4. Salvar

### Logar Ficha Completa:
1. Clicar em "Registrar Treino"
2. Selecionar tab "Ficha"
3. Escolher a ficha desejada
4. Preencher os sets de cada exercício
5. Opcionalmente: remover exercícios ou adicionar extras
6. Clicar em "Registrar Ficha Completa"
7. Sistema cria uma session para cada exercício com XP apropriado

### Editar Ficha:
1. Ir em "Ver Todas as Fichas"
2. Clicar na ficha desejada
3. Editar nome, adicionar/remover exercícios, reordenar
4. Salvar

---

## Storage Key

```typescript
const ROUTINES_KEY = '@life_manager_workout_routines';
```

---

## Traduções Necessárias

```typescript
// types/training.ts - adicionar ao TranslationKey

| 'routine'
| 'routines'
| 'workoutRoutines'
| 'viewAllRoutines'
| 'newRoutine'
| 'routineName'
| 'selectRoutine'
| 'exercisesInRoutine'
| 'addExerciseToRoutine'
| 'removeFromRoutine'
| 'logFullRoutine'
| 'deleteRoutine'
| 'deleteRoutineConfirm'
| 'routineCreated'
| 'routineUpdated'
| 'routineDeleted'
| 'noRoutines'
| 'timesUsed'
| 'singleExercise'
| 'fullRoutine'
```

**Português:**
```typescript
routine: 'Ficha',
routines: 'Fichas',
workoutRoutines: 'Fichas de Treino',
viewAllRoutines: 'Ver Todas as Fichas',
newRoutine: 'Nova Ficha',
routineName: 'Nome da ficha',
selectRoutine: 'Selecionar ficha',
exercisesInRoutine: 'Exercícios da ficha',
addExerciseToRoutine: 'Adicionar exercício',
removeFromRoutine: 'Remover da ficha',
logFullRoutine: 'Registrar Ficha Completa',
deleteRoutine: 'Excluir Ficha',
deleteRoutineConfirm: 'Excluir esta ficha? Os exercícios não serão afetados.',
routineCreated: 'Ficha criada!',
routineUpdated: 'Ficha atualizada!',
routineDeleted: 'Ficha excluída',
noRoutines: 'Nenhuma ficha criada ainda.',
timesUsed: 'vezes usada',
singleExercise: 'Exercício',
fullRoutine: 'Ficha',
```

**English:**
```typescript
routine: 'Routine',
routines: 'Routines',
workoutRoutines: 'Workout Routines',
viewAllRoutines: 'View All Routines',
newRoutine: 'New Routine',
routineName: 'Routine name',
selectRoutine: 'Select routine',
exercisesInRoutine: 'Exercises in routine',
addExerciseToRoutine: 'Add exercise',
removeFromRoutine: 'Remove from routine',
logFullRoutine: 'Log Full Routine',
deleteRoutine: 'Delete Routine',
deleteRoutineConfirm: 'Delete this routine? Exercises will not be affected.',
routineCreated: 'Routine created!',
routineUpdated: 'Routine updated!',
routineDeleted: 'Routine deleted',
noRoutines: 'No routines created yet.',
timesUsed: 'times used',
singleExercise: 'Exercise',
fullRoutine: 'Routine',
```

---

## XP ao Logar Ficha

Ao logar uma ficha completa, o XP é calculado por exercício:
- **+10 XP por exercício logado**
- Exemplo: Ficha com 4 exercícios = +40 XP

---

## Implementação Sugerida

### Fase 1: Base
1. Criar tipos `WorkoutRoutine` e `WorkoutRoutineWithExercises`
2. Criar `training-storage.ts` funções para routines
3. Adicionar ao `training-context.tsx`

### Fase 2: UI de Gerenciamento
4. Criar `routines.tsx` - lista de fichas
5. Criar `routine/[id].tsx` - detalhe da ficha
6. Adicionar botão "Ver Fichas" na tela principal

### Fase 3: Log de Ficha
7. Atualizar modal de Log Session com type selector
8. Implementar UI de log por ficha
9. Implementar criação de múltiplas sessions

---

## Componente TypeSelector (reutilizável)

Criar componente similar ao usado em investments:

```tsx
<View style={styles.typeSelector}>
  <TouchableOpacity
    style={[
      styles.typeOption,
      {
        backgroundColor: sessionType === 'exercise'
          ? 'rgba(76, 175, 80, 0.15)'
          : isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
        borderColor: sessionType === 'exercise'
          ? '#4CAF50'
          : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
    ]}
    onPress={() => setSessionType('exercise')}
  >
    <IconSymbol
      name="dumbbell.fill"
      size={18}
      color={sessionType === 'exercise' ? '#4CAF50' : isDark ? '#666' : '#9CA3AF'}
    />
    <Text style={[
      styles.typeOptionText,
      { color: sessionType === 'exercise' ? '#4CAF50' : isDark ? '#FFFFFF' : '#111827' },
    ]}>
      {t('singleExercise', language)}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.typeOption,
      {
        backgroundColor: sessionType === 'routine'
          ? 'rgba(99, 102, 241, 0.15)'
          : isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
        borderColor: sessionType === 'routine'
          ? '#6366F1'
          : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
    ]}
    onPress={() => setSessionType('routine')}
  >
    <IconSymbol
      name="list.bullet.clipboard"
      size={18}
      color={sessionType === 'routine' ? '#6366F1' : isDark ? '#666' : '#9CA3AF'}
    />
    <Text style={[
      styles.typeOptionText,
      { color: sessionType === 'routine' ? '#6366F1' : isDark ? '#FFFFFF' : '#111827' },
    ]}>
      {t('fullRoutine', language)}
    </Text>
  </TouchableOpacity>
</View>
```

---

## Ícone Necessário

Adicionar em `icon-symbol.tsx`:

```typescript
'list.bullet.clipboard': 'assignment', // Material Icons
```
