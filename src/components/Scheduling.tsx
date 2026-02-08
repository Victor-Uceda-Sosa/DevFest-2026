import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar, Clock, Plus, Trash2, Edit, BookOpen, Stethoscope, GraduationCap, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  type: 'study' | 'rotation' | 'exam' | 'other';
  description: string;
}

const eventTypeConfig = {
  study: { color: 'bg-blue-900/20 text-blue-700', icon: BookOpen },
  rotation: { color: 'bg-green-100 text-green-700', icon: Stethoscope },
  exam: { color: 'bg-red-100 text-red-700', icon: GraduationCap },
  other: { color: 'bg-slate-800/50 text-gray-300', icon: AlertCircle },
};

export function Scheduling() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'MCAT Practice Test',
      date: '2026-02-15',
      time: '09:00',
      type: 'exam',
      description: 'Full-length MCAT practice exam',
    },
    {
      id: 2,
      title: 'Surgery Rotation',
      date: '2026-02-10',
      time: '07:00',
      type: 'rotation',
      description: 'Week 3 of general surgery rotation',
    },
    {
      id: 3,
      title: 'Biochemistry Study Session',
      date: '2026-02-08',
      time: '14:00',
      type: 'study',
      description: 'Review metabolic pathways',
    },
    {
      id: 4,
      title: 'Anatomy Lab',
      date: '2026-02-12',
      time: '13:00',
      type: 'other',
      description: 'Dissection lab - cardiovascular system',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'study' as Event['type'],
    description: '',
  });

  const [selectedWeek, setSelectedWeek] = useState(0);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEvent = () => {
    if (!formData.title || !formData.date || !formData.time) return;

    if (editingEvent) {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEvent.id ? { ...formData, id: event.id } : event
        )
      );
    } else {
      const newEvent: Event = {
        ...formData,
        id: Date.now(),
      };
      setEvents((prev) => [...prev, newEvent]);
    }

    setIsDialogOpen(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      type: 'study',
      description: '',
    });
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const openNewEventDialog = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      type: 'study',
      description: '',
    });
    setIsDialogOpen(true);
  };

  // Generate week view
  const today = new Date('2026-02-07'); // Using a fixed date for demo
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + selectedWeek * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => event.date === dateStr);
  };

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingEvents = sortedEvents.filter((event) => {
    const eventDate = new Date(`${event.date} ${event.time}`);
    return eventDate >= today;
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Study Schedule</h2>
          <p className="text-gray-400">Organize your study sessions, rotations, and exams with AI-powered recommendations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewEventDialog}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., MCAT Study Session"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study Session</SelectItem>
                    <SelectItem value="rotation">Clinical Rotation</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add details about this event..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSaveEvent}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
              >
                {editingEvent ? 'Update Event' : 'Add Event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Scheduling Tips */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-600 flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Optimal Study Time</h4>
              <p className="text-sm text-blue-800">
                Schedule intensive study sessions during your peak performance hours, typically morning or early afternoon.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-600 flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Spaced Repetition</h4>
              <p className="text-sm text-green-800">
                Review material at increasing intervals: 1 day, 3 days, 1 week, and 2 weeks for better retention.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-600 flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">Break Strategy</h4>
              <p className="text-sm text-purple-800">
                Use the Pomodoro Technique: 25-minute focused study sessions with 5-minute breaks in between.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedWeek((prev) => prev - 1)}
                  variant="outline"
                  size="sm"
                >
                  ← Previous
                </Button>
                <Button
                  onClick={() => setSelectedWeek(0)}
                  variant="outline"
                  size="sm"
                >
                  Today
                </Button>
                <Button
                  onClick={() => setSelectedWeek((prev) => prev + 1)}
                  variant="outline"
                  size="sm"
                >
                  Next →
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === today.toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 rounded-lg border-2 ${
                      isToday
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-700/50 bg-white'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <div className="text-xs text-gray-400">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-semibold ${isToday ? 'text-orange-600' : 'text-white'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event) => {
                        const config = eventTypeConfig[event.type];
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEditEvent(event)}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${config.color}`}
                          >
                            <div className="truncate font-medium">{event.title}</div>
                            <div className="text-xs opacity-75">{event.time}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Event Type Legend */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Event Types</h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(eventTypeConfig).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2">
                  <config.icon className="w-4 h-4" />
                  <Badge className={config.color}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  const config = eventTypeConfig[event.type];
                  const eventDate = new Date(`${event.date} ${event.time}`);
                  
                  return (
                    <Card key={event.id} className="p-4 border-2 border-slate-700/50 hover:border-orange-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <config.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{event.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                          </div>
                          {event.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleEditEvent(event)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteEvent(event.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">No upcoming events</p>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-orange-50 border-2 border-orange-100">
            <div className="flex gap-2">
              <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="text-sm text-orange-900">
                <p className="font-semibold mb-1">Stay Organized!</p>
                <p>Schedule regular study blocks and review sessions. Consistency is key to MCAT success.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}