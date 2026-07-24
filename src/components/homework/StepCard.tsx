import { Markdown } from './Markdown';
import { MathText } from '../ui/MathText';
import type { SolutionStep } from '../../types/solve';

interface Props {
  step: SolutionStep;
  last?: boolean;
}

export const StepCard = ({ step, last }: Props) => (
  <section className={last ? '' : 'border-b border-navy/8 pb-5'}>
    <h3 className="mb-2 font-serif text-[17px] font-semibold text-navy">
      <MathText>{step.title}</MathText>
    </h3>

    {step.explanation && <Markdown>{step.explanation}</Markdown>}

    {step.formulas.map((formula, i) => (
      <div key={i} className="my-3 overflow-x-auto rounded-xl bg-cream-light/70 px-4 py-3">
        <Markdown>{`$$${formula}$$`}</Markdown>
      </div>
    ))}

    {step.goal && (
      <p className="mt-2 border-l-2 border-gold/50 pl-3 text-[13px] italic leading-relaxed text-navy/55">{step.goal}</p>
    )}
  </section>
);
