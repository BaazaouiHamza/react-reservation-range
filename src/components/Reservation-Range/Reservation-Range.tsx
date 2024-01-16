import React from "react";
import { useEffect, useState } from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import "./Reservation-Range.css";
import moment, { Moment } from "moment";
import { CalendarDay, DateRangePicker, FocusedInputShape } from "react-dates";

type Data = {
  allDay: boolean;
  end: string;
  start: string;
  overlap: boolean;
  rendering: string;
  color: string;
  className: string;
};

type ReservationRangeProps = {
  startDate: Moment | null;
  endDate: Moment | null;
  setStartDate: React.Dispatch<React.SetStateAction<moment.Moment | null>>;
  setEndDate: React.Dispatch<React.SetStateAction<moment.Moment | null>>;
};

const ReservationRange = ({
  endDate,
  setStartDate,
  setEndDate,
  startDate,
}: ReservationRangeProps) => {
  const [focusedInput, setFocusedInput] = useState<FocusedInputShape | null>(
    null
  );
  const [data, setData] = useState<Data[]>([]); // Initialize data state as an empty array

  useEffect(() => {
    // Fetch data from the server
    fetch("http://localhost:8080/api/data") // Assuming your server is running on the same host
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []); // Empty dependency array means this effect will run once after the initial render
  // Function to check if a day is the start or end date of any data
  const isStartOrEndDate = (day: Moment) =>
    data.some(
      ({ start, end }) =>
        day.isSame(moment(start), "day") || day.isSame(moment(end), "day")
    );

  const handleDatesChange = ({
    startDate,
    endDate,
  }: {
    startDate: Moment | null;
    endDate: Moment | null;
  }) => {
    // Check if the selected range includes any blocked dates
    const isRangeOverBlockedDates = data.some(
      ({ start, end }) =>
        moment(start).isBetween(startDate, endDate, "D", "[)") ||
        moment(end).isBetween(startDate, endDate, "D", "(]")
    );

    if (isRangeOverBlockedDates) {
      // Adjust the start and end dates to prevent spanning over blocked dates
      setStartDate(startDate);
      setEndDate(startDate);
    } else {
      // No blocked dates in the selected range, set the dates as usual
      setStartDate(startDate);
      setEndDate(endDate);
    }
  };

  return (
    <DateRangePicker
      startDate={startDate}
      endDate={endDate}
      endDateId="endDate"
      startDateId="startDate"
      onDatesChange={handleDatesChange}
      focusedInput={focusedInput}
      onFocusChange={(focusedInput) => setFocusedInput(focusedInput)}
      isDayBlocked={(day) => {
        const isBlocked = data.some(({ start, end }) =>
          day.isBetween(moment(start), moment(end), "D", "()")
        );
        return isBlocked;
      }}
      isDayHighlighted={(day) =>
        data.some(
          ({ start, end, overlap }) => overlap && day.isSame(moment(start), "D")
        )
      }
      renderCalendarDay={({ day, modifiers, ...props }) => {
        // Check if the day is the start or end date of any data
        if (isStartOrEndDate(day ?? moment())) {
          // Find the data that matches the day
          const matchingData = data.find(
            ({ start, end }) =>
              day?.isSame(moment(start), "D") || day?.isSame(moment(end), "D")
          );

          // Determine if it's the start or end date
          const isStartDate = day?.isSame(moment(matchingData?.start), "D");

          modifiers?.add(
            isStartDate
              ? "selected-end-no-selected-start"
              : "selected-start-no-selected-end"
          );
        }

        return <CalendarDay day={day} modifiers={modifiers} {...props} />;
      }}
      showClearDates
      reopenPickerOnClearDates
      showDefaultInputIcon
      hideKeyboardShortcutsPanel
    />
  );
};

export default ReservationRange;
