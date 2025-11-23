// import { useRef } from 'react';
// import {
//   Agent,
//   AGENT_COLORS,
//   INTERLOCUTOR_VOICE,
//   INTERLOCUTOR_VOICES,
// } from '@/lib/audio/agents';
// import Modal from './Modal';
// import c from 'classnames';
// import { useAgent, useUI } from '@/lib/audio/state';

// export default function EditAgent() {
//   const agent = useAgent(state => state.current);
//   const updateAgent = useAgent(state => state.update);
//   const nameInput = useRef(null);
//   const { setShowAgentEdit } = useUI();

//   function onClose() {
//     setShowAgentEdit(false);
//   }

//   function updateCurrentAgent(adjustments: Partial<Agent>) {
//     updateAgent(agent.id, adjustments);
//   }

//   return (
//     <Modal onClose={() => onClose()}>
//       <div className="max-w-2xl mx-auto p-6 space-y-6 bg-card text-card-foreground rounded-lg">
//         <div className="space-y-4">
//           <form className="space-y-4">
//             <div>
//               <input
//                 className="w-full px-4 py-3 text-lg border border-border rounded-md bg-input text-input-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
//                 type="text"
//                 placeholder="Name"
//                 value={agent.name}
//                 onChange={e => updateCurrentAgent({ name: e.target.value })}
//                 ref={nameInput}
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-foreground">
//                 Personality
//                 <textarea
//                   value={agent.personality}
//                   onChange={e =>
//                     updateCurrentAgent({ personality: e.target.value })
//                   }
//                   rows={7}
//                   placeholder="How should I act? Whatʼs my purpose? How would you describe my personality?"
//                   className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-input text-input-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
//                 />
//               </label>
//             </div>
//           </form>
//         </div>

//         <div className="space-y-4">
//           <div className="space-y-2">
//             <p className="text-sm font-medium text-foreground">Color</p>
//             <ul className="flex flex-wrap gap-2">
//               {AGENT_COLORS.map((color, i) => (
//                 <li
//                   key={i}
//                   className={c("", { "ring-2 ring-ring ring-offset-2": color === agent.bodyColor })}
//                 >
//                   <button
//                     style={{ backgroundColor: color }}
//                     onClick={() => updateCurrentAgent({ bodyColor: color })}
//                     className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
//                   />
//                 </li>
//               ))}
//             </ul>
//           </div>
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-foreground">
//               Voice
//               <select
//                 value={agent.voice}
//                 onChange={e => {
//                   updateCurrentAgent({
//                     voice: e.target.value as INTERLOCUTOR_VOICE,
//                   });
//                 }}
//                 className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-input text-input-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
//               >
//                 {INTERLOCUTOR_VOICES.map(voice => (
//                   <option key={voice} value={voice}>
//                     {voice}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>
//         </div>
//         <button 
//           onClick={() => onClose()} 
//           className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
//         >
//           Let's go!
//         </button>
//       </div>
//     </Modal>
//   );
// }
