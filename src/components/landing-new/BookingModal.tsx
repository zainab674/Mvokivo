
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, parseISO, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BookingModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const BookingModal = ({ trigger, open, onOpenChange }: BookingModalProps) => {
    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const isActuallyOpen = open !== undefined ? open : isOpenInternal;

    const [selectedTimeZone, setSelectedTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [availableTimeZones, setAvailableTimeZones] = useState<string[]>([]);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [allSlots, setAllSlots] = useState<Record<string, any[]>>({});
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        try {
            // @ts-ignore - Intl.supportedValuesOf is a modern API
            const zones = Intl.supportedValuesOf('timeZone');
            setAvailableTimeZones(zones);
        } catch (e) {
            setAvailableTimeZones([Intl.DateTimeFormat().resolvedOptions().timeZone]);
        }
    }, []);

    const fetchAllSlots = async (timeZone = selectedTimeZone) => {
        setIsLoadingSlots(true);
        try {
            const now = new Date();
            const end = addDays(now, 30);
            const startStr = now.toISOString();
            const endStr = end.toISOString();

            console.log("Fetching slots from:", startStr, "to", endStr, "TimeZone:", timeZone);

            // Using the provided API endpoint and token
            const response = await fetch(`https://api.cal.com/v2/slots/available?eventTypeId=4730130&startTime=${startStr}&endTime=${endStr}&timeZone=${encodeURIComponent(timeZone)}`, {
                headers: {
                    'Authorization': 'Bearer cal_live_d18bcf2d92ce7687d04bcce25d10461a',
                    'cal-api-version': '2024-08-13'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Slots API response:", result);
                if (result.status === 'success' && result.data?.slots) {
                    setAllSlots(result.data.slots);

                    const dates = Object.keys(result.data.slots).sort();
                    if (dates.length > 0) {
                        const todayKey = format(new Date(), 'yyyy-MM-dd');
                        // If today has no slots, or we haven't selected a date yet, pick the first available one
                        if (!result.data.slots[todayKey] || result.data.slots[todayKey].length === 0) {
                            setSelectedDate(parseISO(dates[0]));
                        }
                    }
                }
            } else {
                console.error("Failed to load slots:", response.status, response.statusText);
                toast.error("Failed to load available slots.");
            }
        } catch (error) {
            console.error("Error fetching slots:", error);
            toast.error("Error connecting to scheduling service.");
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (isActuallyOpen && step === 2) {
            fetchAllSlots(selectedTimeZone);
        }
    }, [isActuallyOpen, step, selectedTimeZone]);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error("Please fill in all fields.");
            return;
        }
        setStep(2);
    };

    const handleBookAppointment = async () => {
        if (!selectedSlot) {
            toast.error("Please select a time slot.");
            return;
        }

        setIsBooking(true);
        try {
            const bookingPayload = {
                eventTypeId: 4730130,
                start: selectedSlot,
                attendee: {
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phone,
                    timeZone: selectedTimeZone
                }
            };

            const response = await fetch('https://api.cal.com/v2/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer cal_live_d18bcf2d92ce7687d04bcce25d10461a',
                    'cal-api-version': '2024-08-13'
                },
                body: JSON.stringify(bookingPayload)
            });

            const result = await response.json();
            console.log("Booking response:", result);

            if (response.ok && result.status === 'success') {
                toast.success("Demo session booked successfully! Check your email for details.");
                onOpenChange?.(false);
                setIsOpenInternal(false);
                // Reset for next time
                setStep(1);
                setFormData({ name: '', email: '', phone: '' });
                setSelectedSlot(null);
            } else {
                console.error("Booking failed:", result);
                toast.error(result.message || "Failed to book appointment. Please try again.");
            }
        } catch (error) {
            console.error("Error booking appointment:", error);
            toast.error("Failed to connect to booking service.");
        } finally {
            setIsBooking(false);
        }
    };

    const getSlotsForDate = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return allSlots[dateKey] || [];
    };

    return (
        <Dialog open={isActuallyOpen} onOpenChange={(val) => {
            setIsOpenInternal(val);
            onOpenChange?.(val);
            if (!val) {
                setStep(1); // Reset step when closed
            }
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-4xl p-0 bg-[#0a0b12] border-white/10 text-white overflow-hidden">
                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Sidebar Info */}
                    <div className="md:w-1/3 bg-gradient-to-b from-pink-500/10 to-purple-500/10 p-8 border-b md:border-b-0 md:border-r border-white/10 hidden md:block">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center font-bold">V</div>
                            <span className="font-bold tracking-tighter text-xl">VOKIVO</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Book Your Free Demo</h2>
                        <p className="text-white/60 text-sm leading-relaxed mb-6">
                            See how Vokivo's AI Voice Agents can transform your business with real-time, palm-sized intelligence.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-white/50">
                                <Clock className="w-4 h-4 text-pink-500" />
                                30 Minutes Session
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/50">
                                <CalendarIcon className="w-4 h-4 text-pink-500" />
                                Interactive Demo
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-6 md:p-10 bg-[#0a0b12] overflow-y-auto">
                        <DialogHeader className="mb-8">
                            <DialogTitle className="text-2xl font-bold">
                                {step === 1 ? "Your Contact Details" : "Select a Time"}
                            </DialogTitle>
                            <DialogDescription className="text-white/50">
                                {step === 1 ? "First, tell us who you are so we can reach out." : "Choose a slot that works best for you."}
                            </DialogDescription>
                        </DialogHeader>

                        {step === 1 ? (
                            <form onSubmit={handleNextStep} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-pink-500 font-mono text-xs uppercase tracking-widest">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        className="bg-white/5 border-white/10 h-12 focus:border-pink-500 transition-colors"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-pink-500 font-mono text-xs uppercase tracking-widest">Work Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@company.com"
                                        className="bg-white/5 border-white/10 h-12 focus:border-pink-500 transition-colors"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-pink-500 font-mono text-xs uppercase tracking-widest">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        className="bg-white/5 border-white/10 h-12 focus:border-pink-500 transition-colors"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-white text-black hover:bg-pink-500 hover:text-white font-bold h-12 rounded-lg transition-all"
                                >
                                    CONTINUE TO SCHEDULING
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <Card className="border-white/10 bg-white/5 overflow-hidden shadow-2xl">
                                    <CardHeader className="pb-4 border-b border-white/10 bg-white/5">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <CardTitle className="text-lg flex items-center gap-2 text-white">
                                                <CalendarIcon className="h-4 w-4 text-pink-500" />
                                                Live Availability
                                            </CardTitle>

                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <Clock className="h-4 w-4 text-white/40" />
                                                <Select value={selectedTimeZone} onValueChange={setSelectedTimeZone}>
                                                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs font-mono min-w-[200px] rounded-full">
                                                        <SelectValue placeholder="Select Timezone" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[300px] bg-[#0a0b12] border-white/20">
                                                        {availableTimeZones.map((tz) => (
                                                            <SelectItem
                                                                key={tz}
                                                                value={tz}
                                                                className="text-xs font-mono text-white/70 focus:text-white"
                                                            >
                                                                {tz.replace(/_/g, ' ')}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="flex flex-col lg:flex-row min-h-[350px]">
                                            {/* Date Selection */}
                                            <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-white/10">
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(date) => {
                                                        setSelectedDate(date);
                                                        setSelectedSlot(null);
                                                    }}
                                                    className="rounded-md border-none text-white"
                                                    disabled={(date) => {
                                                        const dateKey = format(date, 'yyyy-MM-dd');
                                                        const hasSlots = allSlots[dateKey] && allSlots[dateKey].length > 0;
                                                        return !hasSlots || date < new Date(new Date().setHours(0, 0, 0, 0));
                                                    }}
                                                />
                                            </div>

                                            {/* Time Selection */}
                                            <div className="flex-1 p-4 bg-white/[0.02]">
                                                {isLoadingSlots ? (
                                                    <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
                                                        <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
                                                        <p className="text-sm text-white/50">Fetching slots...</p>
                                                    </div>
                                                ) : selectedDate ? (
                                                    <ScrollArea className="h-[300px] pr-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {getSlotsForDate(selectedDate).length > 0 ? (
                                                                getSlotsForDate(selectedDate).map((slot: any) => {
                                                                    const time = format(parseISO(slot.time), 'h:mm a');
                                                                    const isSelected = selectedSlot === slot.time;
                                                                    return (
                                                                        <Button
                                                                            key={slot.time}
                                                                            variant={isSelected ? "default" : "outline"}
                                                                            className={cn(
                                                                                "h-10 border-white/10 text-xs font-mono",
                                                                                isSelected ? "bg-pink-500 text-white border-pink-500" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                                                            )}
                                                                            onClick={() => setSelectedSlot(slot.time)}
                                                                        >
                                                                            {time}
                                                                        </Button>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/20">
                                                                    <CalendarIcon className="h-8 w-8 mb-2" />
                                                                    <p className="text-xs uppercase tracking-widest">No slots available</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                ) : (
                                                    <div className="h-[300px] flex flex-col items-center justify-center text-white/20">
                                                        <ChevronRight className="h-8 w-8 mb-2" />
                                                        <p className="text-xs uppercase tracking-widest">Select a date</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {selectedSlot && (
                                    <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                        <p className="text-sm text-pink-500 flex items-center gap-2 font-bold">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {format(parseISO(selectedSlot), 'EEEE, MMM do')} at {format(parseISO(selectedSlot), 'h:mm a')}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5"
                                        onClick={() => setStep(1)}
                                    >
                                        BACK
                                    </Button>
                                    <Button
                                        className="flex-[2] bg-white text-black hover:bg-pink-500 hover:text-white font-bold"
                                        onClick={handleBookAppointment}
                                        disabled={!selectedSlot || isBooking}
                                    >
                                        {isBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "CONFIRM BOOKING"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
