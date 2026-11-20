import { useRef } from 'react';
import { type CellState, FLAG, OPEN, type Field } from '../mines/board';
import type { Hint } from '../mines/hints';

interface Props {
  field: Field;
  state: CellState[];
  cursor: number | null;
  /** 지뢰를 밟았으면 'boom'(지뢰 위치 표시), 다 풀었으면 'win'(남은 지뢰를 깃발로 표시) */
  reveal: 'boom' | 'win' | null;
  hint: Hint | null;
  hintLevel: number;
  /** 누름(짧게) */
  onPrimary: (i: number) => void;
  /** 오른쪽 버튼·길게 누름 */
  onSecondary: (i: number) => void;
}

/** 길게 누르면 반대 동작(깃발) */
const LONG_PRESS_MS = 380;

export function MineBoard({ field, state, cursor, reveal, hint, hintLevel, onPrimary, onSecondary }: Props) {
  const { w, h, num, mine } = field;
  const press = useRef<{ i: number; timer: number; long: boolean } | null>(null);
  const focus = new Set(hint && hintLevel >= 1 ? hint.focus : []);
  const willOpen = new Set(hint && hintLevel >= 3 ? hint.open : []);
  const willFlag = new Set(hint && hintLevel >= 3 ? hint.flag : []);
  const unflag = hint && hintLevel >= 3 ? hint.unflag : undefined;

  const down = (e: React.PointerEvent, i: number) => {
    if (e.button === 2) return;
    e.preventDefault();
    const timer = window.setTimeout(() => {
      if (press.current?.i !== i) return;
      press.current.long = true;
      navigator.vibrate?.(20);
      onSecondary(i);
    }, LONG_PRESS_MS);
    press.current = { i, timer, long: false };
  };
  const up = (i: number) => {
    const p = press.current;
    press.current = null;
    if (!p || p.i !== i) return;
    clearTimeout(p.timer);
    if (!p.long) onPrimary(i);
  };
  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };

  return (
    <div
      className="mine-board"
      role="grid"
      aria-label="지뢰찾기 판"
      style={{ gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))`, aspectRatio: `${w} / ${h}` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {state.map((s, i) => {
        const cls = ['mcell'];
        let content: string | null = null;
        let label = `${Math.floor(i / w) + 1}행 ${(i % w) + 1}열 `;
        if (s === OPEN) {
          cls.push('open');
          if (mine[i]) {
            cls.push('boom');
            content = '💣';
            label += '지뢰';
          } else if (num[i]) {
            cls.push(`n${num[i]}`);
            content = String(num[i]);
            label += String(num[i]);
          } else label += '빈 칸';
        } else if (s === FLAG) {
          cls.push('flag');
          if (reveal && !mine[i]) cls.push('wrong');
          content = '🚩';
          label += '깃발';
        } else if (reveal === 'win' && mine[i]) {
          cls.push('flag');
          content = '🚩';
          label += '깃발';
        } else {
          if (reveal === 'boom' && mine[i]) {
            cls.push('mine-shown');
            content = '💣';
          }
          label += '닫힘';
        }
        if (focus.has(i)) cls.push('focus');
        if (willOpen.has(i)) cls.push('will-open');
        if (willFlag.has(i)) cls.push('will-flag');
        if (unflag === i) cls.push('will-unflag');
        if (i === cursor) cls.push('cursor');
        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            className={cls.join(' ')}
            aria-label={label}
            onPointerDown={(e) => down(e, i)}
            onPointerUp={() => up(i)}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onMouseDown={(e) => {
              if (e.button === 2) onSecondary(i);
            }}
            onKeyDown={(e) => {
              // 칸에 초점이 있을 때 Enter·Space는 App의 키 처리로 넘긴다
              if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
            }}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
