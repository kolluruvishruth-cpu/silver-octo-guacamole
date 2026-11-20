package edu.campus.entity;
import jakarta.persistence.*;
import java.time.*;
@Entity
@Table(name="resources")
public class Resource extends BaseEntity {
 public String name,category,building,location,facilities;
 @Column(length=3000) public String description;
 public String imageUrl;
 public Integer capacity;
 public boolean active=true;
 @Override public String label(){return name;}
}