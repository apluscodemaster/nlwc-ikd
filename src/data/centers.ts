export type FellowshipCenter = {
  id: string;
  name: string;
  address: string;
  leader: string;
  contact: string;
  meetingTime: string;
  location: {
    lat: number;
    lng: number;
  };
};

export const fellowshipCenters: FellowshipCenter[] = [
  {
    id: "1",
    name: "Center A - Ikorodu Central",
    address: "123 Ikorodu Road, Lagos",
    leader: "Bro. John Doe",
    contact: "+234 801 234 5678",
    meetingTime: "Every Thursday, 6:00 PM",
    location: { lat: 6.5967, lng: 3.5029 },
  },
  {
    id: "2",
    name: "Center B - Aga/Odoguyan",
    address: "45 Aga Street, Ikorodu",
    leader: "Sis. Jane Smith",
    contact: "+234 802 345 6789",
    meetingTime: "Every Thursday, 6:00 PM",
    location: { lat: 6.6123, lng: 3.5145 },
  },
  {
    id: "3",
    name: "Center C - Ebute",
    address: "Ebute Ipakodo, Ikorodu",
    leader: "Bro. David Wilson",
    contact: "+234 803 456 7890",
    meetingTime: "Every Thursday, 6:30 PM",
    location: { lat: 6.5845, lng: 3.4912 },
  },
  {
    id: "4",
    name: "Center D - Agric/Isawo",
    address: "Owutu Agric, Ikorodu",
    leader: "Pastor Michael",
    contact: "+234 804 567 8901",
    meetingTime: "Every Thursday, 6:00 PM",
    location: { lat: 6.6212, lng: 3.4856 },
  },
];
