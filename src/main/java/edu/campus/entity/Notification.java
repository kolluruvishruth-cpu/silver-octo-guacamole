package edu.campus.entity;
import jakarta.persistence.*;
import java.time.*;
@Entity
@Table(name="notifications")
public class Notification extends BaseEntity {
 @ManyToOne(optional=false) @com.fasterxml.jackson.annotation.JsonIgnore public User user;
 public String title;
 @Column(length=2000) public String message;
 public boolean isRead=false;
 @Override public String label(){return title;}
}