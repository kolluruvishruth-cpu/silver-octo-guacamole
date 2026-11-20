package edu.campus.entity;
import jakarta.persistence.*;
import java.time.*;
@Entity
@Table(name="bookings",indexes={@Index(columnList="resource_id,startTime,endTime"),@Index(columnList="user_id,status")})
public class Booking extends BaseEntity {
 @ManyToOne(optional=false) public User user;
 @ManyToOne(optional=false) public Resource resource;
 public LocalDateTime startTime,endTime;
 public String purpose,status="PENDING",rejectionReason;
 @Column(length=3000) public String notes;
 public Integer attendees;
 @Override public String label(){return purpose;}
}