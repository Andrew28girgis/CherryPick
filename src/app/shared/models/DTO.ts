export class General {
  activities: Activity[] = [];
}
export interface Activity {
  usertId: number;
  actionName: string;
  placeName: string;
  userName: string;
  placeId: number;
  actionDate: Date;
  workSpacePlaceId: null;
}
