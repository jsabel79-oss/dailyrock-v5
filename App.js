import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MINUTES = 5;
const DEFAULT_DURATION = 30;
const SLOT_HEIGHT = 18;

const CATEGORIES = {
  Business: {
    color: '#2563eb',
    presets: ['Prospecting', 'Follow Up', 'Listing Presentation', 'Listing Appointment', 'MLS', 'Marketing', 'Email'],
  },
  Health: { color: '#16a34a', presets: ['Walk', 'Swim', 'Stretch'] },
  Faith: { color: '#7c3aed', presets: ['Prayer', 'Bible', 'Recovery'] },
  Kids: { color: '#f97316', presets: ['Isaiah', 'Board Games', 'Cashflow', 'Karate', 'Walk', 'Fortnite'] },
  Driving: { color: '#64748b', presets: ['Drive'] },
  Admin: { color: '#0891b2', presets: ['Paperwork', 'Calls', 'Planning'] },
  Personal: { color: '#db2777', presets: ['Meal', 'Errands', 'Home'] },
};

const GHOST_SCHEDULE = [
  { time: '07:00', title: 'Faith' },
  { time: '08:00', title: 'Walk' },
  { time: '09:30', title: 'Prospecting' },
  { time: '13:15', title: 'Swim' },
  { time: '15:30', title: 'Kids' },
  { time: '20:30', title: 'Recovery' },
];

const WEEKLY_GHOSTS = {
  1: [{ time: '11:00', title: 'Brandon Coaching' }],
  2: [
    { time: '10:00', title: 'Office Meeting' },
    { time: '14:00', title: 'Office Tour' },
  ],
};

function minutesFromTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const displayHour = ((hours + 11) % 12) + 1;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function snapMinutes(minutes) {
  return Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - SLOT_MINUTES, Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES));
}

export default function App() {
  const [selectedSlot, setSelectedSlot] = useState(9 * 60);
  const [selectedCategory, setSelectedCategory] = useState('Business');
  const [activities, setActivities] = useState([]);
  const [dayFinished, setDayFinished] = useState(false);
  const today = new Date().getDay();

  const slots = useMemo(() => {
    const allSlots = [];
    for (let minute = START_HOUR * 60; minute < END_HOUR * 60; minute += SLOT_MINUTES) {
      allSlots.push(minute);
    }
    return allSlots;
  }, []);

  const ghosts = useMemo(() => [...GHOST_SCHEDULE, ...(WEEKLY_GHOSTS[today] || [])], [today]);

  const totals = useMemo(() => {
    const summary = Object.keys(CATEGORIES).reduce((acc, category) => ({ ...acc, [category]: 0 }), {});
    activities.forEach((activity) => {
      summary[activity.category] += activity.duration;
    });
    return summary;
  }, [activities]);

  const addActivity = (preset) => {
    setActivities((current) => [
      ...current,
      {
        id: `${Date.now()}-${preset}`,
        title: preset,
        category: selectedCategory,
        start: snapMinutes(selectedSlot),
        duration: DEFAULT_DURATION,
      },
    ]);
    setDayFinished(false);
  };

  const adjustActivity = (id, field, amount) => {
    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== id) return activity;
        if (field === 'duration') {
          return { ...activity, duration: Math.max(SLOT_MINUTES, activity.duration + amount) };
        }
        return { ...activity, start: snapMinutes(activity.start + amount) };
      }),
    );
    setDayFinished(false);
  };

  const totalHours = activities.reduce((sum, activity) => sum + activity.duration, 0) / 60;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f2e8" />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Daily Rock V5</Text>
          <Text style={styles.title}>Tap what happened.</Text>
        </View>
        <TouchableOpacity style={styles.finishButton} onPress={() => setDayFinished(true)}>
          <Text style={styles.finishButtonText}>{dayFinished ? 'Saved' : 'Finish Day'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(CATEGORIES).map(([category, data]) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, selectedCategory === category && { backgroundColor: data.color }]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
          {CATEGORIES[selectedCategory].presets.map((preset) => (
            <TouchableOpacity key={preset} style={styles.presetButton} onPress={() => addActivity(preset)}>
              <Text style={styles.presetText}>{preset}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent}>
        {slots.map((minute) => {
          const ghost = ghosts.find((item) => minutesFromTime(item.time) === minute);
          const slotActivities = activities.filter((activity) => activity.start === minute);
          const isHour = minute % 60 === 0;
          return (
            <TouchableOpacity key={minute} activeOpacity={0.75} onPress={() => setSelectedSlot(minute)}>
              <View style={[styles.slot, selectedSlot === minute && styles.selectedSlot]}>
                <Text style={[styles.timeText, !isHour && styles.minorTime]}>{isHour ? formatTime(minute) : minute % 15 === 0 ? formatTime(minute) : ''}</Text>
                <View style={styles.slotBody}>
                  {ghost && <Text style={styles.ghostText}>{ghost.title}</Text>}
                  {slotActivities.map((activity) => (
                    <View key={activity.id} style={[styles.activityCard, { borderLeftColor: CATEGORIES[activity.category].color }]}> 
                      <View style={styles.activityTopRow}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityMeta}>{activity.duration}m</Text>
                      </View>
                      <Text style={styles.activityCategory}>{activity.category} • {formatTime(activity.start)}</Text>
                      <View style={styles.controlsRow}>
                        <TouchableOpacity style={styles.adjustButton} onPress={() => adjustActivity(activity.id, 'duration', -5)}><Text>-5</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.adjustButton} onPress={() => adjustActivity(activity.id, 'duration', 5)}><Text>+5</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.adjustButton} onPress={() => adjustActivity(activity.id, 'start', -5)}><Text>↑ 5</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.adjustButton} onPress={() => adjustActivity(activity.id, 'start', 5)}><Text>↓ 5</Text></TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.weekView}>
        <Text style={styles.weekTitle}>Week totals</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(totals).map(([category, minutes]) => (
            <View key={category} style={styles.totalPill}>
              <View style={[styles.dot, { backgroundColor: CATEGORIES[category].color }]} />
              <Text style={styles.totalText}>{category} {Math.round((minutes / 60) * 10) / 10}h</Text>
            </View>
          ))}
          <View style={styles.totalPill}><Text style={styles.totalText}>Total {Math.round(totalHours * 10) / 10}h</Text></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f2e8' },
  header: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: '#78716c', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#1c1917', fontSize: 30, fontWeight: '900' },
  finishButton: { backgroundColor: '#1c1917', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  finishButtonText: { color: '#fffaf0', fontWeight: '800' },
  pickerPanel: { backgroundColor: '#fffaf0', borderBottomColor: '#e7dfd0', borderTopColor: '#e7dfd0', borderBottomWidth: 1, borderTopWidth: 1, padding: 12 },
  categoryChip: { borderRadius: 999, borderWidth: 1, borderColor: '#d6cbbb', marginRight: 8, paddingHorizontal: 14, paddingVertical: 10 },
  categoryText: { color: '#44403c', fontWeight: '800' },
  categoryTextActive: { color: '#ffffff' },
  presetsRow: { marginTop: 10 },
  presetButton: { backgroundColor: '#ede5d8', borderRadius: 14, marginRight: 8, paddingHorizontal: 13, paddingVertical: 10 },
  presetText: { color: '#292524', fontWeight: '700' },
  timeline: { flex: 1 },
  timelineContent: { paddingBottom: 20 },
  slot: { minHeight: SLOT_HEIGHT, flexDirection: 'row', borderBottomColor: '#eadfce', borderBottomWidth: StyleSheet.hairlineWidth, paddingRight: 12 },
  selectedSlot: { backgroundColor: '#fff7db' },
  timeText: { width: 76, color: '#57534e', fontSize: 11, fontWeight: '800', paddingLeft: 12, paddingTop: 4 },
  minorTime: { color: '#a8a29e', fontWeight: '600' },
  slotBody: { flex: 1, borderLeftColor: '#ded2bf', borderLeftWidth: 1, paddingLeft: 10, paddingVertical: 2 },
  ghostText: { color: '#8b8174', fontSize: 18, fontWeight: '900', opacity: 0.28, position: 'absolute', top: 0, left: 12 },
  activityCard: { backgroundColor: '#ffffff', borderLeftWidth: 8, borderRadius: 14, elevation: 2, marginBottom: 5, padding: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  activityTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityTitle: { color: '#1c1917', fontSize: 16, fontWeight: '900' },
  activityMeta: { color: '#57534e', fontWeight: '900' },
  activityCategory: { color: '#78716c', fontWeight: '700', marginTop: 2 },
  controlsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  adjustButton: { backgroundColor: '#f1eadf', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  weekView: { backgroundColor: '#fffaf0', borderTopColor: '#e7dfd0', borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  weekTitle: { color: '#1c1917', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  totalPill: { alignItems: 'center', backgroundColor: '#f1eadf', borderRadius: 12, flexDirection: 'row', marginRight: 8, paddingHorizontal: 10, paddingVertical: 8 },
  dot: { borderRadius: 5, height: 10, marginRight: 6, width: 10 },
  totalText: { color: '#292524', fontWeight: '800' },
});
