package edu.campus.service;
import edu.campus.entity.*;
import edu.campus.dto.Requests.BookingRequest;
public interface BookingService {
 Booking request(User user, BookingRequest input);
 Booking cancel(User user,Long id);
 Booking decide(Long id,String status,String reason);
}
