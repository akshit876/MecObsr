// "use client";

// import { useMarkingData } from "@/hooks/useMarkingData";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// export default function MarkingDataPage() {
//   const {
//     codeMarkingData,
//     textMarkingData,
//     serialNoSettings,
//     handleInputChange,
//     handleResetSerial,
//   } = useMarkingData();

//   return (
//     <div className="p-4 bg-black text-yellow-300 space-y-4">
//       <h1 className="text-2xl font-bold">MARKING DATA</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <Card className="bg-black border-yellow-300">
//           <CardHeader>
//             <CardTitle>CODE MARKING DATA</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-2">
//             {Object.entries(codeMarkingData).map(([key, value]) => (
//               <div key={key} className="grid grid-cols-2 items-center gap-2">
//                 <Label htmlFor={`code-${key}`}>{key.toUpperCase()}</Label>
//                 <Input
//                   id={`code-${key}`}
//                   value={value}
//                   onChange={(e) =>
//                     handleInputChange("code", key, e.target.value)
//                   }
//                   readOnly={[
//                     "dieNo",
//                     "date",
//                     "shift",
//                     "serialNo",
//                     "dmcData",
//                   ].includes(key)}
//                   className="bg-black text-green-400 border-yellow-300"
//                 />
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <div className="space-y-4">
//           <Card className="bg-black border-yellow-300">
//             <CardHeader>
//               <CardTitle>TEXT MARKING DATA</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-2">
//               {Object.entries(textMarkingData).map(([key, value]) => (
//                 <div key={key} className="grid grid-cols-2 items-center gap-2">
//                   <Label htmlFor={`text-${key}`}>{key.toUpperCase()}</Label>
//                   <Input
//                     id={`text-${key}`}
//                     value={value}
//                     readOnly
//                     className="bg-black text-green-400 border-yellow-300"
//                   />
//                 </div>
//               ))}
//             </CardContent>
//           </Card>

//           <Card className="bg-black border-yellow-300">
//             <CardHeader>
//               <CardTitle>SERIAL NO</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-2">
//               <div className="grid grid-cols-2 items-center gap-2">
//                 <Input
//                   value={serialNoSettings.current}
//                   readOnly
//                   className="bg-black text-green-400 border-yellow-300"
//                 />
//                 <Button onClick={handleResetSerial} variant="outline">
//                   RESET
//                 </Button>
//               </div>
//               <div className="grid grid-cols-2 items-center gap-2">
//                 <Label htmlFor="start-from">START FROM</Label>
//                 <Input
//                   id="start-from"
//                   value={serialNoSettings.startFrom}
//                   onChange={(e) =>
//                     handleInputChange("serial", "startFrom", e.target.value)
//                   }
//                   className="bg-black text-green-400 border-yellow-300"
//                 />
//               </div>
//               <div className="grid grid-cols-2 items-center gap-2">
//                 <Label htmlFor="reset-time">RESET SPECIFY TIME</Label>
//                 <Input
//                   id="reset-time"
//                   type="time"
//                   value={serialNoSettings.resetSpecifyTime}
//                   onChange={(e) =>
//                     handleInputChange(
//                       "serial",
//                       "resetSpecifyTime",
//                       e.target.value
//                     )
//                   }
//                   className="bg-black text-green-400 border-yellow-300"
//                 />
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
