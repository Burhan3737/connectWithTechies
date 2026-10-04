import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown, FieldLabel } from './Dropdown';

const groups = [
  { options: [{ value: '', label: 'All kinds' }] },
  { label: 'Kinds', options: [{ value: 'hackathon', label: 'Hackathon', count: 12 }, { value: 'meetup', label: 'Meetup', count: 40 }] },
];

function setup(value = '') {
  const onChange = vi.fn();
  render(<><FieldLabel id="kind">Kind</FieldLabel><Dropdown id="kind" label="Kind" value={value} groups={groups} onChange={onChange} /></>);
  return { onChange, trigger: screen.getByRole('button', { name: /kind/i }) };
}

describe('Dropdown', () => {
  it('shows the current choice and is named by its label', () => {
    const { trigger } = setup('meetup');
    expect(trigger).toHaveTextContent('Meetup');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with labels and counts, marks the current option, and chooses on click', async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = setup();
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /hackathon/i })).toHaveTextContent('Hackathon12');
    expect(screen.getByRole('option', { name: /all kinds/i })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('option', { name: /meetup/i }));
    expect(onChange).toHaveBeenCalledWith('meetup');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('works from the keyboard', async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = setup();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /all kinds/i })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('hackathon');
    await user.keyboard('{Enter}');
    await user.keyboard('m');
    expect(screen.getByRole('option', { name: /meetup/i })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not report a change when the same option is chosen', async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = setup('meetup');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: /meetup/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
