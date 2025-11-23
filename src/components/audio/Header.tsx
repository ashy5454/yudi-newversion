// import { useAgent, useUI, useUser } from '@/lib/audio/state';
// import c from 'classnames';
// import { useEffect, useState } from 'react';
// import { useLiveAPIContext } from '@/components/audio/LiveAPIContext';
// import { Agent, createNewAgent } from '@/lib/audio/agents';
// import { LoginButton } from '@/components/LoginButton';

// export default function Header() {
//   const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
//   const { name } = useUser();
//   const { current, setCurrent, availablePresets, availablePersonal, addAgent } =
//     useAgent();
//   const { disconnect } = useLiveAPIContext();

//   let [showRoomList, setShowRoomList] = useState(false);

//   useEffect(() => {
//     addEventListener('click', () => setShowRoomList(false));
//     return () => removeEventListener('click', () => setShowRoomList(false));
//   }, []);

//   function changeAgent(agent: Agent | string) {
//     disconnect();
//     setCurrent(agent);
//   }

//   function addNewChatterBot() {
//     disconnect();
//     addAgent(createNewAgent());
//     setShowAgentEdit(true);
//   }

//   return (
//     <header className="flex items-center justify-between p-4 bg-card text-card-foreground border-b border-border">
//       <div className="relative">
//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2">
//             <button
//               onClick={e => {
//                 e.stopPropagation();
//                 setShowRoomList(!showRoomList);
//               }}
//               className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 transition-colors"
//             >
//               <h1 className={c("text-lg font-semibold flex items-center gap-1", { "text-primary": showRoomList })}>
//                 {current.name}
//                 <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
//               </h1>
//             </button>

//             <button
//               onClick={() => setShowAgentEdit(true)}
//               className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
//             >
//               <span className="material-symbols-outlined text-sm">edit</span> Edit
//             </button>
//           </div>
//         </div>

//         <div className={c('absolute top-full left-0 mt-2 bg-card text-card-foreground rounded-lg shadow-lg border border-border p-4 min-w-64 z-10', { 'hidden': !showRoomList })}>
//           <div className="space-y-4">
//             <div>
//               <h3 className="text-sm font-medium text-muted-foreground mb-2">Presets</h3>
//               <ul className="space-y-1">
//                 {availablePresets
//                   .filter(agent => agent.id !== current.id)
//                   .map(agent => (
//                     <li
//                       key={agent.name}
//                       className={c("", { "bg-accent text-accent-foreground": agent.id === current.id })}
//                     >
//                       <button 
//                         onClick={() => changeAgent(agent)}
//                         className="w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
//                       >
//                         {agent.name}
//                       </button>
//                     </li>
//                   ))}
//               </ul>
//             </div>

//             <div>
//               <h3 className="text-sm font-medium text-muted-foreground mb-2">Your ChatterBots</h3>
//               {
//                 <ul className="space-y-1 mb-3">
//                   {availablePersonal.length ? (
//                     availablePersonal.map(({ id, name }) => (
//                       <li key={name} className={c("", { "bg-accent text-accent-foreground": id === current.id })}>
//                         <button 
//                           onClick={() => changeAgent(id)}
//                           className="w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
//                         >
//                           {name}
//                         </button>
//                       </li>
//                     ))
//                   ) : (
//                     <p className="text-sm text-muted-foreground px-2 py-1">None yet.</p>
//                   )}
//                 </ul>
//               }
//               <button
//                 className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
//                 onClick={() => {
//                   addNewChatterBot();
//                 }}
//               >
//                 <span className="material-symbols-outlined text-sm">add</span>New ChatterBot
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="flex items-center gap-4">
//         <button
//           className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
//           onClick={() => setShowUserConfig(!showUserConfig)}
//         >
//           <p className='text-sm font-medium'>{name || 'Your name'}</p>
//           <span className="material-symbols-outlined text-sm">tune</span>
//         </button>
//         <LoginButton />
//       </div>
//     </header>
//   );
// }
