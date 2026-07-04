import { ConveyorBelt, type BeltPacket } from '../ConveyorBelt';

interface Packet {
  id: string;
  title: string;
  private?: boolean;
  indexed?: boolean;
}

interface ArenaBeltProps {
  packets: Packet[];
  running?: boolean;
  fast?: boolean;
  label?: string;
}

/** Arena-styled conveyor belt — delegates to shared ConveyorBelt */
export function ArenaBelt({ packets, running, fast, label }: ArenaBeltProps) {
  const mapped: BeltPacket[] = packets.map((p) => ({
    id: p.id,
    title: p.title,
    private: p.private,
    indexed: p.indexed,
  }));

  return <ConveyorBelt fast={fast} label={label} packets={mapped} running={running} />;
}