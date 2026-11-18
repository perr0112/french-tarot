import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Room } from './Room';

const { FakeSocket } = vi.hoisted(() => {
  /** A stand-in for the room socket: tests play the server's part. */
  class FakeSocket extends EventTarget {
    static instances: FakeSocket[] = [];
    readonly sent: unknown[] = [];
    constructor() {
      super();
      FakeSocket.instances.push(this);
    }
    send(data: string) {
      this.sent.push(JSON.parse(data));
    }
    close() {
      this.dispatchEvent(new Event('close'));
    }
  }
  return { FakeSocket };
});

vi.mock('partysocket', () => ({ default: FakeSocket }));

const server = {
  open(socket: InstanceType<typeof FakeSocket> | undefined) {
    act(() => void socket?.dispatchEvent(new Event('open')));
  },
  answer(socket: InstanceType<typeof FakeSocket> | undefined, message: unknown) {
    const data = JSON.stringify(message);
    act(() => void socket?.dispatchEvent(new MessageEvent('message', { data })));
  },
};

const sitAs = (name: string) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: "S'asseoir" }));
};

describe('choosing a nickname', () => {
  beforeEach(() => {
    localStorage.clear();
    FakeSocket.instances = [];
  });

  it('joins again when the same nickname is retried after it was taken', () => {
    render(<Room code="ABCDEF" />);
    sitAs('Alice');
    const first = FakeSocket.instances.at(-1);
    server.open(first);
    server.answer(first, { type: 'error', code: 'NICKNAME_TAKEN' });
    expect(screen.getByText('Ce pseudo est déjà pris à cette table.')).toBeTruthy();

    sitAs('Alice');
    const second = FakeSocket.instances.at(-1);
    expect(second).not.toBe(first);
    server.open(second);
    expect(second?.sent).toEqual([{ type: 'join', nickname: 'Alice' }]);
  });
});
