import type { OperatorAnimal } from './stress';
import { BadgerBody } from './BadgerBody';
import { PenguinBody } from './PenguinBody';

interface OperatorAnimalBodyProps {
  animal: OperatorAnimal;
  uid: string;
}

export function OperatorAnimalBody({ animal, uid }: OperatorAnimalBodyProps) {
  if (animal === 'penguin') return <PenguinBody uid={uid} />;
  return <BadgerBody uid={uid} />;
}