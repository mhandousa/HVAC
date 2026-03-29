import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHijriDate, formatHijriDate } from '@/hooks/useHijriDate';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface HijriDatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function HijriDatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  className,
}: HijriDatePickerProps) {
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const [calendarType, setCalendarType] = useState<'gregorian' | 'hijri'>('gregorian');
  const hijriDate = useHijriDate(date || new Date());

  const formatDisplayDate = (selectedDate: Date) => {
    const gregorian = format(selectedDate, 'PPP');
    const hijri = formatHijriDate(selectedDate, language);
    
    if (calendarType === 'hijri') {
      return hijri;
    }
    return `${gregorian} | ${hijri}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-start font-normal',
            !date && 'text-muted-foreground',
            isRTL && 'flex-row-reverse',
            className
          )}
        >
          <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
          {date ? formatDisplayDate(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
        <Tabs value={calendarType} onValueChange={(v) => setCalendarType(v as 'gregorian' | 'hijri')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gregorian">{t('calendar.gregorian')}</TabsTrigger>
            <TabsTrigger value="hijri">{t('calendar.hijri')}</TabsTrigger>
          </TabsList>
          <TabsContent value="gregorian" className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
            />
          </TabsContent>
          <TabsContent value="hijri" className="p-3">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'التاريخ الهجري' : 'Hijri Date Display'}
              </p>
              <div className="text-2xl font-bold text-foreground">
                {hijriDate.formattedAr}
              </div>
              <div className="text-sm text-muted-foreground">
                {hijriDate.formatted}
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                initialFocus
              />
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
