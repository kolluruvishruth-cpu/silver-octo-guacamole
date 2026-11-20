package edu.campus.service.impl;
import edu.campus.entity.*;
import edu.campus.repository.*;
import edu.campus.dto.Requests.BookingRequest;
import edu.campus.exception.DomainException;
import edu.campus.service.BookingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
@Service
public class BookingServiceImpl implements BookingService {
 @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;
 private final BookingRepository bookings; private final ResourceRepository resources; private final NotificationRepository notifications;
 public BookingServiceImpl(BookingRepository b,ResourceRepository r,NotificationRepository n){bookings=b;resources=r;notifications=n;}
 void notify(User u,String title,String message){var n=new Notification();n.user=u;n.title=title;n.message=message;notifications.save(n);}
 @Override @Transactional public Booking request(User u,BookingRequest q){
  var r=resources.lockById(q.resourceId()).orElseThrow(()->new DomainException("Resource not found"));
  if(!r.active)throw new DomainException("This resource is inactive");
  if(!u.active)throw new DomainException("Account disabled");
  if(!q.startTime().isAfter(LocalDateTime.now()))throw new DomainException("Choose a future start time");
  if(!q.endTime().isAfter(q.startTime()))throw new DomainException("End time must be later than start time");
  if(q.attendees()!=null && (q.attendees()<1 || r.capacity!=null && q.attendees()>r.capacity))throw new DomainException("Attendees exceed capacity or are invalid");
  if(!bookings.conflicts(r.id,q.startTime(),q.endTime()).isEmpty())throw new DomainException("This time overlaps a pending or approved booking");
  var b=new Booking();b.user=u;b.resource=r;b.startTime=q.startTime();b.endTime=q.endTime();b.purpose=q.purpose();b.attendees=q.attendees();b.notes=q.notes();bookings.save(b);
  notify(u,"Booking submitted",r.name+": your request is pending review.");return b;
 }
 @Override @Transactional public Booking cancel(User u,Long id){
  var initial=bookings.findById(id).orElseThrow(()->new DomainException("Booking not found"));
  resources.lockById(initial.resource.id).orElseThrow();
  var b=bookings.findById(id).orElseThrow();
  entityManager.refresh(b);
  if(!b.user.id.equals(u.id))throw new DomainException("Booking not found");
  if(!b.startTime.isAfter(LocalDateTime.now()) || !(b.status.equals("PENDING")||b.status.equals("APPROVED")))throw new DomainException("Only pending or approved future bookings can be cancelled");
  b.status="CANCELLED";notify(u,"Booking cancelled",b.resource.name+": the time slot has been released.");return bookings.save(b);
 }
 @Override @Transactional public Booking decide(Long id,String status,String reason){
  var initial=bookings.findById(id).orElseThrow(()->new DomainException("Booking not found"));
  resources.lockById(initial.resource.id).orElseThrow();
  var b=bookings.findById(id).orElseThrow();
  entityManager.refresh(b);
  if(status.equals("COMPLETED")) {if(!b.status.equals("APPROVED")||b.endTime.isAfter(LocalDateTime.now()))throw new DomainException("Only ended approved bookings can be completed");}
  else {if(!b.status.equals("PENDING"))throw new DomainException("Only pending requests can be reviewed");
   if(status.equals("REJECTED")&&(reason==null||reason.isBlank()))throw new DomainException("Enter a rejection reason");
   if(status.equals("APPROVED")){
    if(!b.startTime.isAfter(LocalDateTime.now()))throw new DomainException("Booking has already started");
    if(!b.resource.active)throw new DomainException("Reactivate the resource before approval");
    if(bookings.conflicts(b.resource.id,b.startTime,b.endTime).stream().anyMatch(x->!x.id.equals(id)))throw new DomainException("Another booking occupies this time");
   }
  }
  b.status=status;b.rejectionReason=status.equals("REJECTED")?reason:null;notify(b.user,"Booking "+status.toLowerCase(),b.resource.name+(reason==null?"":": "+reason));return bookings.save(b);
 }
}
