import { Component, Inject, OnInit } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { AgmCoreModule } from 'angular2-google-maps/core';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/forkJoin';

@Component({
    selector: 'students',
    templateUrl: './students.component.html',
    styleUrls: ['./students.component.css']
})

export class StudentsComponent {
    public students: Student[];
    public selectedStudent: Student | undefined;
    public lat: number = 37.526019;
    public lng: number = 15.074601;
    
    constructor(private http: Http, @Inject('BASE_URL') private baseUrl: string) {
        this.refreshData();
    }

    ngOnInit() {
        navigator.geolocation.getCurrentPosition((position) => { this.lat = position.coords.latitude; this.lng = position.coords.longitude; });
    }

    async refreshData() {
        this.http.get(this.baseUrl + 'api/students').subscribe(result => {
            let studentList = [];

            for (let stud of result.json() as Student[]) {

                let student = new Student();
                student.id = stud.id;
                student.name = stud.name;
                student.latitude = stud.latitude;
                student.longitude = stud.longitude;
                student.dateOfBirth = stud.dateOfBirth;
                student.hasChanges = false;
                studentList.push(student);
            }

            console.log("Refresh ok");

            this.students = studentList;

            this.selectStudent();
        }, error => console.error(error));
    }


    selectStudent(): void {

        this.selectedStudent = undefined;

        for (let stud of this.students) {
            if (stud.deleted == false) {
                this.selectedStudent = stud;
                break;
            }

        }
    }


    async putData(): Promise<void> {
        let headers = new Headers({ 'Content-Type': 'application/json' });

        let serverCalls = [];

        for (let student of this.students) {
            if (student.hasChanges == true || student.deleted) {
                
                let json = JSON.stringify(student.toJSON());

                if (!student.id) { //create
                    if (!student.deleted) {
                        let call = this.http.put(this.baseUrl + 'api/students', json, { headers: headers });
                        serverCalls.push(call);
                    }
                }
                else {
                    if (student.deleted) {
                        let url = this.baseUrl + 'api/students?id=' + student.id;
                        let call = this.http.delete(url, { headers: headers });
                        serverCalls.push(call);
                    }
                    else {
                        let call = this.http.post(this.baseUrl + 'api/students', json, { headers: headers });
                        serverCalls.push(call);
                    }

                }
            }
        }
        Observable.forkJoin(serverCalls)
            .subscribe(data => {
                this.refreshData();
            }, error => console.error(error));


    }

    onSelect(student: Student): void {
        if (student.deleted == false) {
            this.selectedStudent = student;
        }
    }

    addNewStudent(): void {
        this.selectedStudent = new Student();
        this.selectedStudent.hasChanges = true;
        this.selectedStudent.latitude = this.lat;
        this.selectedStudent.longitude = this.lng;
        this.students.push(this.selectedStudent);
    }

    async saveChanges(): Promise<void> {
        await this.putData();
        //console.log("update completed");
        //await this.refreshData();
    }

    delete(student: Student): void {
        student.deleted = true;
        this.selectStudent();
    }
}

class Student {
    id: number;

    private _name: string = "";
    private _dateOfBirth: Date;
    private _latitude: number = 0;
    private _longitude: number = 0;
    public hasChanges: boolean;
    public deleted: boolean = false;

    get name(): string {
        return this._name;
    }
    set name(n: string) {
        this._name = n;
        this.hasChanges = true;
        console.log("set name");
    }

    get latitude(): number {
        return this._latitude;
    }
    set latitude(l: number) {
        this._latitude = l;
        this.hasChanges = true;
        console.log("set latitude");
    }

    get longitude(): number {
        return this._longitude;
    }
    set longitude(l: number) {
        this._longitude = l;
        this.hasChanges = true;
        console.log("set longitude");
    }

    get dateOfBirth(): Date {
        return this._dateOfBirth;
    }
    set dateOfBirth(d: Date) {
        this._dateOfBirth = d;
        this.hasChanges = true;
        console.log("set dateOfBirth");
    }

    public toJSON() {
        return {
            id: this.id,
            name: this._name,
            latitude: this._latitude,
            longitude: this._longitude,
            dateOfBirth: this._dateOfBirth,
        };
    };
}