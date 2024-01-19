import React, { useEffect, useState } from "react";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import "./Reservation-Range.css";
import moment, { Moment } from "moment";
import { CalendarDay, DateRangePicker, FocusedInputShape } from "react-dates";
import { BlockedTd, CheckTd, Day, HighLightedTd } from "./styled";

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
  console.log("data", data);
  // Function to check if a day is the start or end date of any data
  // const isStartOrEndDate = (day: Moment) =>
  //   data.some(
  //     ({ start, end }) =>
  //       day.isSame(moment(start), "day") || day.isSame(moment(end), "day")
  //   );

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
      renderCalendarDay={({ day, modifiers, ...props }) => {
        const blockedData = data.filter(({ start, end, color }) =>
          day && day.isBetween(moment(start), moment(end), "D", "()")
            ? { start, end, color }
            : null
        );

        if (blockedData.length > 0) {
          return blockedData.map(({ start, end, color }) => (
            <BlockedTd
              key={`${start}-${end}`}
              daySize={props.daySize}
              color={color}
              blocked={true}
              style={{ width: props.daySize, height: props.daySize }}
            >
              <Day daySize={props.daySize}>
                <span>{day && day.format("D")}</span>
              </Day>
            </BlockedTd>
          ));
        }
        const matchingStartData = data.find(({ start }) =>
          day?.isSame(moment(start), "D")
        );
        const matchingEndData = data.find(({ end }) =>
          day?.isSame(moment(end), "D")
        );

        if (matchingStartData && matchingEndData) {
          const color1 = matchingStartData.color;
          const color2 = matchingEndData.color;

          return (
            <HighLightedTd
              key={`${matchingStartData.start}-${matchingEndData.end}`}
              daySize={props.daySize}
              color1={color1}
              color2={color2}
              style={{ width: props.daySize, height: props.daySize }}
            >
              <Day daySize={props.daySize}>
                <span>{day && day.format("D")}</span>
              </Day>
            </HighLightedTd>
          );
        }
        const matchingData = data.find(
          ({ start, end }) =>
            day?.isSame(moment(start), "D") || day?.isSame(moment(end), "D")
        );
        if (matchingData) {
          // Determine if it's the start or end date
          const isStartDate = day?.isSame(moment(matchingData.start), "D");
          const selectedStart = modifiers && modifiers.has("selected-start");
          const selectedEnd = modifiers && modifiers.has("selected-end");
          // Map CheckTd components for matching data where checkIn is true
          return (
            <CheckTd
              key={matchingData.start}
              daySize={props.daySize}
              color={matchingData.color}
              checkIn={isStartDate}
              style={{ width: props.daySize, height: props.daySize }}
              onClick={(event) =>props.onDayClick && props.onDayClick(day ?? moment(), event)}
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              onMouseEnter={(event)=>props.onDayMouseEnter && props.onDayMouseEnter(day ?? moment(),event)}
              onMouseLeave={(event)=>props.onDayMouseLeave && props.onDayMouseLeave(day ?? moment(),event)}
            >
              <Day daySize={props.daySize}>
                <span>{day && day.format("D")}</span>
              </Day>
            </CheckTd>
          );
        }

        return (
          <CalendarDay
            day={day}
            modifiers={modifiers}
            {...props}
          />
        );
      }}
      showClearDates
      reopenPickerOnClearDates
      showDefaultInputIcon
      hideKeyboardShortcutsPanel
      numberOfMonths={3}
    />
  );
};

export default ReservationRange;
