import type { Mess, User } from "@prisma/client";
import { parseJSON } from "@/lib/api-client";
import { db } from "@/lib/db";

export interface MessListItemShape {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  rentPerSeat: number;
  contactNumber: string;
  photos: string[];
  amenities: string[];
  totalSeats: number;
  vacantSeats: number;
  totalRooms: number;
  description: string | null;
  ownerName: string;
}

/**
 * Serialize a mess (with its owner relation) into the MessListItem shape.
 */
export function serializeMess(
  mess: Mess & { owner: Pick<User, "id" | "name"> }
): MessListItemShape {
  return {
    id: mess.id,
    code: mess.code,
    name: mess.name,
    type: mess.type,
    address: mess.address,
    area: mess.area,
    city: mess.city,
    lat: mess.lat,
    lng: mess.lng,
    rentPerSeat: mess.rentPerSeat,
    contactNumber: mess.contactNumber,
    photos: parseJSON<string[]>(mess.photos, []),
    amenities: parseJSON<string[]>(mess.amenities, []),
    totalSeats: mess.totalSeats,
    vacantSeats: mess.vacantSeats,
    totalRooms: mess.totalRooms,
    description: mess.description,
    ownerName: mess.owner?.name ?? "Unknown",
  };
}

/** Recompute & persist Mess.vacantSeats from current Seat rows. */
export async function recomputeVacantSeats(messId: string): Promise<number> {
  const vacant = await db.seat.count({ where: { messId, status: "VACANT" } });
  await db.mess.update({ where: { id: messId }, data: { vacantSeats: vacant } });
  return vacant;
}
