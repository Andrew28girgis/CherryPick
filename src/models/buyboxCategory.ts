import { BbPlace } from "./buyboxPlaces";

export interface BuyboxCategory {
  id: number;
  name: string;
  isChecked:boolean;
  places: BbPlace[];
}