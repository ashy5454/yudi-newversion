import { db } from '@/lib/firebase/firebase';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';

export const fetchYudiMetrics = async () => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayStartTime = todayStart.getTime();

    // Helper to convert Firestore timestamp to Date
    const toDate = (timestamp: any): Date => {
      if (timestamp?.toDate) {
        return timestamp.toDate();
      } else if (timestamp?.seconds) {
        return new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        return timestamp;
      } else if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      return new Date();
    };

    // Helper to check if message is from today
    const isToday = (createdAt: any): boolean => {
      if (!createdAt) return false;
      const msgDate = toDate(createdAt);
      const msgTime = msgDate.getTime();
      return msgTime >= todayStartTime;
    };

    // 1. Total Users & Growth
    const usersSnap = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnap.size;

    // 2. Get all rooms
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    const activeRooms = roomsSnap.size;

    // 3. Count messages from both locations
    let totalMessages = 0;
    let todayMessages = 0;
    let todayConversationsFromRoot = 0;
    const todayRoomIds = new Set<string>();

    // Count from root messages collection (backward compatibility)
    try {
      const rootMessagesSnap = await getDocs(collection(db, 'messages'));
      totalMessages += rootMessagesSnap.size;
      
      rootMessagesSnap.docs.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt || data.timestamp;
        if (createdAt && isToday(createdAt)) {
          todayMessages++;
        }
        // Track unique rooms for today's conversations
        if (data.roomId && createdAt && isToday(createdAt)) {
          todayRoomIds.add(data.roomId);
        }
      });
      todayConversationsFromRoot = todayRoomIds.size;
    } catch (error) {
      console.warn('Error fetching root messages:', error);
    }

    // Count from subcollections (rooms/{roomId}/messages)
    // Also calculate conversation durations for Average Time Spent
    let totalConversationDuration = 0; // in milliseconds
    let conversationsWithDuration = 0;
    let todayConversations = todayConversationsFromRoot; // New conversations started today (start with root collection count)
    
    const roomPromises = roomsSnap.docs.map(async (roomDoc) => {
      const roomId = roomDoc.id;
      const roomData = roomDoc.data();
      
      // Check if room was created today
      const roomCreatedAt = roomData.createdAt || roomData.timestamp || roomData.lastMessageAt;
      if (roomCreatedAt && isToday(roomCreatedAt)) {
        todayConversations++;
      }
      
      try {
        const subCollectionRef = collection(db, 'rooms', roomId, 'messages');
        const subMsgQuery = query(subCollectionRef);
        const subSnap = await getDocs(subMsgQuery);
        
        let roomMessageCount = 0;
        let roomTodayCount = 0;
        let firstMessageTime: number | null = null;
        let lastMessageTime: number | null = null;
        
        subSnap.docs.forEach((msgDoc) => {
          roomMessageCount++;
          const data = msgDoc.data();
          const createdAt = data.createdAt || data.timestamp;
          
          if (createdAt) {
            const msgTime = toDate(createdAt).getTime();
            
            if (isToday(createdAt)) {
              roomTodayCount++;
            }
            
            // Track first and last message times for duration calculation
            if (firstMessageTime === null || msgTime < firstMessageTime) {
              firstMessageTime = msgTime;
            }
            if (lastMessageTime === null || msgTime > lastMessageTime) {
              lastMessageTime = msgTime;
            }
          }
        });
        
        // Calculate conversation duration (time between first and last message)
        if (firstMessageTime !== null && lastMessageTime !== null && roomMessageCount > 1) {
          const duration = lastMessageTime - firstMessageTime;
          totalConversationDuration += duration;
          conversationsWithDuration++;
        }
        
        return { total: roomMessageCount, today: roomTodayCount };
      } catch (error) {
        console.warn(`Error fetching messages for room ${roomId}:`, error);
        return { total: 0, today: 0 };
      }
    });

    const roomResults = await Promise.all(roomPromises);
    const subTotalMessages = roomResults.reduce((sum, r) => sum + r.total, 0);
    const subTodayMessages = roomResults.reduce((sum, r) => sum + r.today, 0);

    totalMessages += subTotalMessages;
    todayMessages += subTodayMessages;

    // Calculate metrics
    // 1. Average Conversations Per User (Chat Depth)
    const avgConversationsPerUser = totalUsers > 0 ? (activeRooms / totalUsers).toFixed(1) : '0.0';
    
    // 2. Average Time Spent (Average conversation duration in minutes)
    const avgTimeSpentMinutes = conversationsWithDuration > 0 
      ? (totalConversationDuration / conversationsWithDuration / (1000 * 60)).toFixed(1)
      : '0.0';

    return {
      totalUsers,
      totalMessages,
      todayMessages, // Total messages sent by all users in last 24h
      avgConversationsPerUser, // Average conversations per user (Chat Depth)
      activeRooms, // Total conversation threads/rooms created
      avgTimeSpentMinutes, // Average time spent per conversation (in minutes)
      todayConversations, // New conversations started in last 24h
    };
  } catch (error) {
    console.error('Error fetching Yudi metrics:', error);
    throw error;
  }
};

